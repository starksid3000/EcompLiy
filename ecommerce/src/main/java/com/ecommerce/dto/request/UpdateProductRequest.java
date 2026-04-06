package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateProductRequest {

    @Size(max = 200)
    private String name;

    private String description;

    @DecimalMin(value = "0.00", message = "Price must be >= 0")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal price;

    @Min(value = 0, message = "Stock must be >= 0")
    private Integer stock;

    @Size(max = 50)
    private String sku;

    private String imageUrl;

    private String categoryId;

    private Boolean isActive;
}
