package com.ecommerce.dto.request;

import lombok.Data;

@Data
public class QueryCategoryRequest {
    private Boolean isActive;
    private String search;
    private Integer page=1;
    private Integer limit=1;
}
