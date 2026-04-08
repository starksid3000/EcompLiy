package com.ecommerce.dto.request;


import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateOrderRequest {
    @NotBlank(message = "Shipping address is requried")
    private String shippingAddress;
}
