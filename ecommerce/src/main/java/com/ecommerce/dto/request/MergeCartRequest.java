package com.ecommerce.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class MergeCartRequest {

    @NotEmpty(message = "Items array cannot be empty")
    @Valid
    private List<AddToCartRequest> items;
}
