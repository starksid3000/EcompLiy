package com.ecommerce.dto.request;

import com.ecommerce.entity.enums.OrderStatus;
import lombok.Data;

@Data
public class QueryOrderRequest {
    private OrderStatus status;
    private Integer page = 1;
    private Integer limit = 10;
}
