package com.ecommerce.service;

import com.ecommerce.dto.request.AddToCartRequest;
import com.ecommerce.dto.request.MergeCartRequest;
import com.ecommerce.dto.response.CartItemResponse;
import com.ecommerce.dto.response.CartResponse;
import com.ecommerce.entity.Cart;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public Cart getOrCreateActiveCartEntity(UUID userId) {
        // Fetch active cart. If order related properties exist later (like abandoned checkout), they'd be handled here.
        Optional<Cart> optionalCart = cartRepository.findActiveCartWithItemsByUserId(userId);

        if (optionalCart.isPresent()) {
            return optionalCart.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Cart cart = Cart.builder()
                .user(user)
                .checkedOut(false)
                .build();

        log.debug("Created new active cart for user: {}", userId);
        return cartRepository.save(cart);
    }

    public CartResponse getActiveCart(UUID userId) {
        Cart cart = getOrCreateActiveCartEntity(userId);
        return formatCart(cart);
    }

    @Transactional
    public CartResponse addToCart(UUID userId, AddToCartRequest request) {
        Cart cart = getOrCreateActiveCartEntity(userId);

        UUID productId = UUID.fromString(request.getProductId());
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (!product.isActive()) {
            throw new BadRequestException("Product is no longer active");
        }

        // Check if item already exists in cart
        Optional<CartItem> existingItemOpt = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();

            if (product.getStock() < newQuantity) {
                throw new BadRequestException("Not enough stock available. Requested: " + newQuantity + ", Available: " + product.getStock());
            }

            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
            log.debug("Updated cart item {} to quantity {}", existingItem.getId(), newQuantity);
        } else {
            if (product.getStock() < request.getQuantity()) {
                throw new BadRequestException("Not enough stock available. Requested: " + request.getQuantity() + ", Available: " + product.getStock());
            }

            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .build();

            cartItemRepository.save(newItem);
            cart.getCartItems().add(newItem);
            log.debug("Added new item to cart: {}", productId);
        }

        // Must re-fetch or format fresh state
        return formatCart(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Transactional
    public CartResponse updateCartItem(UUID userId, UUID itemId, int quantity) {
        Cart cart = getOrCreateActiveCartEntity(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to your active cart");
        }

        if (item.getProduct().getStock() < quantity) {
            throw new BadRequestException("Not enough stock available. Requested: " + quantity + ", Available: " + item.getProduct().getStock());
        }

        item.setQuantity(quantity);
        cartItemRepository.save(item);
        log.debug("Updated cart item {} to quantity {}", itemId, quantity);

        return formatCart(cartRepository.findById(cart.getId()).orElse(cart));
    }

    @Transactional
    public CartResponse removeFromCart(UUID userId, UUID itemId) {
        Cart cart = getOrCreateActiveCartEntity(userId);

        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("Cart item does not belong to your active cart");
        }

        cartItemRepository.delete(item);
        cart.getCartItems().remove(item);
        log.debug("Removed item {} from cart", itemId);

        return formatCart(cart);
    }

    @Transactional
    public CartResponse clearCart(UUID userId) {
        Cart cart = getOrCreateActiveCartEntity(userId);

        cartItemRepository.deleteAll(cart.getCartItems());
        cart.getCartItems().clear();
        log.debug("Cleared cart for user {}", userId);

        return formatCart(cart);
    }

    @Transactional
    public CartResponse mergeCart(UUID userId, MergeCartRequest request) {
        // Reuse addToCart logic perfectly
        for (AddToCartRequest item : request.getItems()) {
            try {
                this.addToCart(userId, item);
            } catch (Exception e) {
                log.warn("Failed to merge product {} into cart: {}", item.getProductId(), e.getMessage());
                // In production, might want to collect all errors or skip gracefully. Returning to match existing implementation.
            }
        }
        return getActiveCart(userId);
    }

    // --- Helper ---

    private CartResponse formatCart(Cart cart) {
        List<CartItemResponse> items = cart.getCartItems().stream().map(item -> {
            Product p = item.getProduct();
            CartItemResponse.ProductSummary ps = CartItemResponse.ProductSummary.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .price(p.getPrice().doubleValue())
                    .imageUrl(p.getImageUrl())
                    .sku(p.getSku())
                    .stock(p.getStock())
                    .build();

            return CartItemResponse.builder()
                    .id(item.getId())
                    .quantity(item.getQuantity())
                    .product(ps)
                    .build();
        }).toList();

        double totalPrice = cart.getCartItems().stream()
                .mapToDouble(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())).doubleValue())
                .sum();

        int totalItems = cart.getCartItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .userId(cart.getUser().getId())
                .items(items)
                .totalPrice(totalPrice)
                .totalItems(totalItems)
                .build();
    }
}
