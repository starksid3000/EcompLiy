package com.ecommerce.service;

import com.ecommerce.dto.request.CreateProductRequest;
import com.ecommerce.dto.request.QueryProductRequest;
import com.ecommerce.dto.request.UpdateProductRequest;
import com.ecommerce.dto.response.PaginatedResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductImage;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.repository.CategoryRepository;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Mirrors NestJS ProductsService:
 *  - create()       → check SKU uniqueness, create with category
 *  - findAll()      → paginated with optional category/isActive/search filters
 *  - findOne()      → by ID with category + images
 *  - update()       → SKU conflict check
 *  - updateStock()  → stock adjustment (positive to add, negative to subtract)
 *  - remove()       → block if product is part of existing orders
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderItemRepository orderItemRepository;

    // ── Create ───────────────────────────────────────────────────────────────

    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        // Check SKU uniqueness
        if (productRepository.existsBySku(request.getSku())) {
            throw new ConflictException("Product with SKU " + request.getSku() + " already exists");
        }

        // Resolve category
        Category category = categoryRepository.findById(UUID.fromString(request.getCategoryId()))
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .sku(request.getSku())
                .imageUrl(request.getImageUrl())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .category(category)
                .build();

        productRepository.save(product);
        log.debug("Created product: {} (SKU: {})", product.getName(), product.getSku());

        return formatProduct(product);
    }

    // ── Find All (paginated, with filters) ───────────────────────────────────

    public PaginatedResponse<ProductResponse> findAll(QueryProductRequest query) {
        int page = query.getPage() != null ? query.getPage() : 1;
        int limit = query.getLimit() != null ? query.getLimit() : 10;
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage;

        if (query.getSearch() != null && !query.getSearch().isBlank()) {
            // Search by name/description — LIKE-based (simpler than pg_trgm but same API contract)
            productPage = productRepository.searchActiveProducts(query.getSearch().trim(), pageable);
        } else if (query.getCategory() != null && !query.getCategory().isBlank()) {
            UUID categoryId = UUID.fromString(query.getCategory());
            if (query.getIsActive() != null) {
                productPage = productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
            } else {
                productPage = productRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
            }
        } else if (query.getIsActive() != null && query.getIsActive()) {
            productPage = productRepository.findByIsActiveTrue(pageable);
        } else {
            productPage = productRepository.findAll(pageable);
        }

        List<ProductResponse> data = productPage.getContent().stream()
                .map(this::formatProduct)
                .toList();

        return PaginatedResponse.<ProductResponse>builder()
                .data(data)
                .meta(PaginatedResponse.Meta.builder()
                        .total(productPage.getTotalElements())
                        .page(page)
                        .limit(limit)
                        .totalPages(productPage.getTotalPages())
                        .build())
                .build();
    }

    // ── Find One ─────────────────────────────────────────────────────────────

    public ProductResponse findOne(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        return formatProduct(product);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // SKU conflict check
        if (request.getSku() != null && !request.getSku().equals(product.getSku())) {
            if (productRepository.existsBySku(request.getSku())) {
                throw new ConflictException("Product with SKU " + request.getSku() + " already exists");
            }
            product.setSku(request.getSku());
        }

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getStock() != null) product.setStock(request.getStock());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getIsActive() != null) product.setActive(request.getIsActive());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(UUID.fromString(request.getCategoryId()))
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            product.setCategory(category);
        }

        productRepository.save(product);
        log.debug("Updated product: {}", product.getId());

        return formatProduct(product);
    }

    // ── Update Stock ─────────────────────────────────────────────────────────

    @Transactional
    public ProductResponse updateStock(UUID id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        int newStock = product.getStock() + quantity;
        if (newStock < 0) {
            throw new BadRequestException("Insufficient stock");
        }

        product.setStock(newStock);
        productRepository.save(product);
        log.debug("Updated stock for product {}: {} -> {}", id, product.getStock() - quantity, newStock);

        return formatProduct(product);
    }

    // ── Remove ───────────────────────────────────────────────────────────────

    @Transactional
    public Map<String, String> remove(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        // Block deletion if product is part of existing orders
        List<?> orderItems = orderItemRepository.findByProductId(id);
        if (!orderItems.isEmpty()) {
            throw new BadRequestException(
                    "Cannot delete product that is part of existing orders. Consider marking it as inactive only"
            );
        }

        productRepository.delete(product);
        log.debug("Deleted product: {}", id);

        return Map.of("message", "Product deleted successfully");
    }

    // ── Helper: format product → response DTO ────────────────────────────────

    private ProductResponse formatProduct(Product product) {
        // Safely load images
        List<ProductResponse.ImageDto> imageDtos;
        try {
            List<ProductImage> images = product.getImages();
            imageDtos = images != null ? images.stream()
                    .sorted((a, b) -> Integer.compare(a.getPosition(), b.getPosition()))
                    .map(img -> ProductResponse.ImageDto.builder()
                            .id(img.getId())
                            .url(img.getUrl())
                            .altText(img.getAltText())
                            .position(img.getPosition())
                            .build())
                    .toList() : Collections.emptyList();
        } catch (Exception e) {
            imageDtos = Collections.emptyList();
        }

        // Safely load category name
        String categoryName;
        String categoryId;
        try {
            Category cat = product.getCategory();
            categoryName = cat != null ? cat.getName() : null;
            categoryId = cat != null ? cat.getId().toString() : null;
        } catch (Exception e) {
            categoryName = null;
            categoryId = null;
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice().doubleValue())
                .stock(product.getStock())
                .sku(product.getSku())
                .imageUrl(product.getImageUrl())
                .isActive(product.isActive())
                .categoryId(categoryId)
                .category(categoryName)
                .images(imageDtos)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
