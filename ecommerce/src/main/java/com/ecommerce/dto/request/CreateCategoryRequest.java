package com.ecommerce.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateCategoryRequest {
    @NotBlank(message = "Category name is required")
    @Size(min=2, max=100, message = "Name must be between  2 and 100 characters")
    private String name;

    private String description;

    @Size(max = 100, message = "Category slug cannot exceed 100 character")
    private String slug;

    private String imageUrl;

    private Boolean isActive=true;
}
