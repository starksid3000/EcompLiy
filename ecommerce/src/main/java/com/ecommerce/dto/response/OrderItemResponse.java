package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderItemResponse {
    private UUID id;
    private UUID productId;
    private int quantity;
    private double unitPrice;
    private double subtotal;
    private ProductSummary product;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSummary {
        private String name;
        private String sku;
        private String imageUrl;
    }
}
