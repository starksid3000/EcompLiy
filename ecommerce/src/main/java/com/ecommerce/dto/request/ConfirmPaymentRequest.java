package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmPaymentRequest {

    @NotBlank(message = "Payment Intent ID is required")
    private String paymentIntentId;

    @NotBlank(message = "Order ID is required")
    private String orderId;
}
