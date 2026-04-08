package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateOrderRequest;
import com.ecommerce.dto.request.QueryOrderRequest;
import com.ecommerce.dto.request.UpdateOrderRequest;
import com.ecommerce.dto.response.OrderResponse;
import com.ecommerce.dto.response.PaginatedResponse;
import com.ecommerce.entity.User;
import com.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Tag(name = "orders")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create new order from active cart")
    public ResponseEntity<OrderResponse> createOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(user, request));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get current user's orders")
    public ResponseEntity<PaginatedResponse<OrderResponse>> getMyOrders(
            @AuthenticationPrincipal User user,
            QueryOrderRequest query
    ) {
        return ResponseEntity.ok(orderService.getUserOrders(user.getId(), query));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID (must belong to user unless admin)")
    public ResponseEntity<OrderResponse> getOrderById(
            @AuthenticationPrincipal User user,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(orderService.getOrderById(id, user.getId()));
    }

    @GetMapping("/number/{orderNumber}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get order by order number (Admin only)")
    public ResponseEntity<OrderResponse> getOrderByOrderNumber(@PathVariable String orderNumber) {
        return ResponseEntity.ok(orderService.getOrderByOrderNumber(orderNumber));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all orders (Admin only)")
    public ResponseEntity<PaginatedResponse<OrderResponse>> getAllOrders(QueryOrderRequest query) {
        return ResponseEntity.ok(orderService.getAllOrders(query));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update order status (Admin only)")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOrderRequest request
    ) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request));
    }
}
