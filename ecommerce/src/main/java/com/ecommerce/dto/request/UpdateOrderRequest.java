package com.ecommerce.dto.request;

import com.ecommerce.entity.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrderRequest {
    @NotNull(message = "Status cannot be null")
    private OrderStatus status;
}
