package com.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.repository.Meta;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> data;
    private Meta meta;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Meta{
        private long total;
        private int page;
        private int limit;
        private int totalPages;
    }
}
