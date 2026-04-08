package com.ecommerce.dto.response;

import com.ecommerce.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private UUID userId;
    private String orderNumber;
    private OrderStatus status;
    private double totalAmount;
    private String shippingAddress;
    private List<OrderItemResponse> items;
    private PaymentSummary payment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentSummary{
        private UUID id;
        private String stauts;
        private String method;
    }
}
