package com.ecommerce.dto.request;

import com.ecommerce.entity.enums.OrderStatus;
import lombok.Data;

@Data
public class QueryOrderRequest {
    public OrderStatus status;
    public Integer page=1;
    public Integer limit=10;
}
