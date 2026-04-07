package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {
    private UUID id;
    private String name;
    private String description;
    private String  slug;
    private String imageUrl;
    private boolean isActive;
    private int productCount;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
