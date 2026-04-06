package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateProductRequest;
import com.ecommerce.dto.request.QueryProductRequest;
import com.ecommerce.dto.request.StockUpdateRequest;
import com.ecommerce.dto.request.UpdateProductRequest;
import com.ecommerce.dto.response.PaginatedResponse;
import com.ecommerce.dto.response.ProductResponse;
import com.ecommerce.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "products")
public class ProductController {
    private final ProductService productService;


    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new product ADMIN Only")
    public ResponseEntity<ProductResponse> create(@Valid @RequestBody CreateProductRequest createProductRequest) {
        return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(createProductRequest));
    }

    //Get Product find all

    @GetMapping
    @Operation(summary = "Get all product with optinal filters")
    public ResponseEntity<PaginatedResponse<ProductResponse>> findAll(QueryProductRequest queryProductRequest) {
        return ResponseEntity.ok(productService.findAll(queryProductRequest));
    }

    //Get product by id
    @GetMapping("/{id}")
    @Operation(summary = "Get product by id")
    public ResponseEntity<ProductResponse> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.findOne(id));
    }


    //Patch product
    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product details")
    public ResponseEntity<ProductResponse> update(@PathVariable UUID id, @Valid @RequestBody UpdateProductRequest updateProductRequest) {
        return ResponseEntity.ok(productService.update(id, updateProductRequest));
    }

    //Patch product stock
    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product stock")
    public ResponseEntity<ProductResponse> updateStock(@PathVariable UUID id, @Valid @RequestBody StockUpdateRequest updateStockRequest) {
        return ResponseEntity.ok(productService.updateStock(id, updateStockRequest.getQuantity()));
    }

    //Delete Product
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete product with id")
    public ResponseEntity<Map<String, String>> delete(@PathVariable UUID id){
        return ResponseEntity.ok(productService.remove(id));
    }
}
