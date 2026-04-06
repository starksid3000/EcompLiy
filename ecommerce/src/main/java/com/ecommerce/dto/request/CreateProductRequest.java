package com.ecommerce.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 200)
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.00", message = "Price must be >= 0")
    @Digits(integer = 8, fraction = 2, message = "Price must be a valid number e.g. 99.99")
    private BigDecimal price;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock must be >= 0")
    private Integer stock;

    @NotBlank(message = "SKU is required")
    @Size(max = 50)
    private String sku;

    private String imageUrl;

    @NotBlank(message = "Category ID is required")
    private String categoryId;

    private Boolean isActive = true;
}
