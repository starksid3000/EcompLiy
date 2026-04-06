package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class QueryProductRequest {
    private String category;
    private Boolean isActive;
    private String Search;
    private Integer page = 1;
    private Integer limit = 10;
}
