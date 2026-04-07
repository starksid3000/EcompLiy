package com.ecommerce.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCategoryRequest {
    @Size(min = 2, max = 100, message = "Name must be 2 and 100 characters")
    private String name;

    @Size(max = 100, message = "Category slug must be max 100 character")
    private String slug;

    private String description;

    private String imageUrl;

    private String isActive;
}
