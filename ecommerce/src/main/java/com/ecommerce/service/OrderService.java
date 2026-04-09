package com.ecommerce.service;

import com.ecommerce.dto.request.CreateOrderRequest;
import com.ecommerce.dto.request.QueryOrderRequest;
import com.ecommerce.dto.request.UpdateOrderRequest;
import com.ecommerce.dto.response.OrderItemResponse;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.PaginatedResponse;
import com.ecommerce.entity.*;
import com.ecommerce.entity.enums.OrderStatus;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;

    @Transactional
    public OrderResponse createOrder(User user, CreateOrderRequest request) {
        Cart cart = cartRepository.findActiveCartWithItemsByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("No active cart found"));

        if (cart.getCartItems() == null || cart.getCartItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        double totalAmount = 0.0;

        // Verify stock for all items
        for (CartItem item : cart.getCartItems()) {
            Product product = item.getProduct();
            if (product.getStock() < item.getQuantity()) {
                throw new BadRequestException("Product " + product.getName() + " does not have enough stock");
            }
            if (!product.isActive()) {
                throw new BadRequestException("Product " + product.getName() + " is no longer active");
            }
            
            totalAmount += product.getPrice().doubleValue() * item.getQuantity();
        }

        String orderNumber = "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Order order = Order.builder()
                .user(user)
                .cart(cart)
                .orderNumber(orderNumber)
                .totalAmount(BigDecimal.valueOf(totalAmount))
                .status(OrderStatus.PENDING)
                .shippingAddress(request.getShippingAddress())
                .build();

        order = orderRepository.save(order);

        for (CartItem cartItem : cart.getCartItems()) {
            Product product = cartItem.getProduct();
            
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(product.getPrice())
                    .build();

            orderItemRepository.save(orderItem);
            order.getOrderItems().add(orderItem);

            // Deduct stock
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepository.save(product);
        }

        // Close out the cart
        cart.setCheckedOut(true);
        cartRepository.save(cart);

        log.debug("Created order {} for user {}", orderNumber, user.getId());

        return formatOrder(order);
    }

    public PaginatedResponse<OrderResponse> getUserOrders(UUID userId, QueryOrderRequest query) {
        int page = query.getPage() != null ? query.getPage() : 1;
        int limit = query.getLimit() != null ? query.getLimit() : 10;
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<Order> orderPage = orderRepository.findByUserId(userId, pageable);
        
        List<OrderResponse> data = orderPage.getContent().stream()
                .map(this::formatOrder)
                .toList();

        return PaginatedResponse.<OrderResponse>builder()
                .data(data)
                .meta(PaginatedResponse.Meta.builder()
                        .total(orderPage.getTotalElements())
                        .page(page)
                        .limit(limit)
                        .totalPages(orderPage.getTotalPages())
                        .build())
                .build();
    }

    public OrderResponse getOrderById(UUID id, UUID userId) {
        Order order = orderRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found or you don't have access"));
        return formatOrder(orderRepository.findByIdWithItems(order.getId()).orElse(order));
    }

    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumberWithDetails(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return formatOrder(order);
    }

    public PaginatedResponse<OrderResponse> getAllOrders(QueryOrderRequest query) {
        int page = query.getPage() != null ? query.getPage() : 1;
        int limit = query.getLimit() != null ? query.getLimit() : 10;
        
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orderPage;

        if (query.getStatus() != null) {
            orderPage = orderRepository.findByStatus(query.getStatus(), pageable);
        } else {
            orderPage = orderRepository.findAll(pageable);
        }
        
        List<OrderResponse> data = orderPage.getContent().stream()
                .map(this::formatOrder)
                .toList();

        return PaginatedResponse.<OrderResponse>builder()
                .data(data)
                .meta(PaginatedResponse.Meta.builder()
                        .total(orderPage.getTotalElements())
                        .page(page)
                        .limit(limit)
                        .totalPages(orderPage.getTotalPages())
                        .build())
                .build();
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID id, UpdateOrderRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        order.setStatus(request.getStatus());
        orderRepository.save(order);
        
        log.debug("Updated order {} status to {}", id, request.getStatus());
        
        return formatOrder(orderRepository.findByIdWithItems(order.getId()).orElse(order));
    }

    // --- Format Helpers ---

    private OrderResponse formatOrder(Order order) {
        List<OrderItemResponse> items = order.getOrderItems() != null ? order.getOrderItems().stream().map(item -> {
            OrderItemResponse.ProductSummary ps = null;
            if (item.getProduct() != null) {
                ps = OrderItemResponse.ProductSummary.builder()
                    .name(item.getProduct().getName())
                    .sku(item.getProduct().getSku())
                    .imageUrl(item.getProduct().getImageUrl())
                    .build();
            }

            return OrderItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getPrice().doubleValue())
                    .subtotal(item.getPrice().doubleValue() * item.getQuantity())
                    .product(ps)
                    .build();
        }).toList() : List.of();

        OrderResponse.PaymentSummary pSummary = null;
        if (order.getPayment() != null) {
            pSummary = OrderResponse.PaymentSummary.builder()
                    .id(order.getPayment().getId())
                    .status(order.getPayment().getStatus().name())
                    .method(order.getPayment().getPaymentMethod())
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount().doubleValue())
                .shippingAddress(order.getShippingAddress())
                .items(items)
                .payment(pSummary)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }
}
