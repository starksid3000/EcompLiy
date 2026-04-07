package com.ecommerce.service;

import com.ecommerce.dto.request.CreateCategoryRequest;
import com.ecommerce.dto.request.QueryCategoryRequest;
import com.ecommerce.dto.request.UpdateCategoryRequest;
import com.ecommerce.dto.response.CategoryResponse;
import com.ecommerce.dto.response.PaginatedResponse;
import com.ecommerce.entity.Category;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.GlobalExceptionHandler;
import com.ecommerce.repository.CategoryRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryRepository categoryrepository;

    @Transactional
    public CategoryResponse create(CreateCategoryRequest request){
        String slug = generateSlug(request.getName(), request.getSlug());

        if(categoryrepository.existsBySlug(slug)){
            throw new ConflictException("Category with " + slug + " already exists");
        }
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .slug(slug)
                .imageUrl(request.getImageUrl())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        category = categoryrepository.save(category);
        log.debug("Created category : {}" , category.getName());

        return formatCategory(category);
    }
    @Transactional
    public PaginatedResponse<CategoryResponse> findAll(QueryCategoryRequest query){
        int page = query.getPage() != null ? query.getPage() : 1;
        int limit = query.getLimit() != null ? query.getLimit() : 10;

        Pageable pageable = PageRequest.of(page-1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Category> categoryPage;

        if(query.getSearch() != null && !query.getSearch().isBlank()){
            categoryPage = categoryrepository.searchCategories(query.getSearch().trim(),pageable);
        }else if(query.getIsActive() != null){
            categoryPage = categoryrepository.findByIsActive(query.getIsActive(), pageable);
        }else{
            categoryPage = categoryrepository.findAll(pageable);
        }
        List<CategoryResponse> data = categoryPage.getContent().stream()
                .map(this::formatCategory)
                .toList();

        return PaginatedResponse.<CategoryResponse>builder()
                .data(data)
                .meta(PaginatedResponse.Meta.builder()
                        .total(categoryPage.getTotalElements())
                        .page(page)
                        .limit(limit)
                        .totalPages(categoryPage.getTotalPages())
                        .build())
                .build();
    }

    public CategoryResponse findOne(UUID id){
        Category category = categoryrepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("Category not found"));
        return formatCategory(category);
    }

    public CategoryResponse findBySlug(String slug){
        Category category = categoryrepository.findBySlug(slug)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("Category with slug not found"));
        return formatCategory(category);
    }

    @Transactional
    public CategoryResponse update(UUID id, UpdateCategoryRequest request){
        Category category = categoryrepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("CategoryNotfound"));

        if(request.getName() != null){
            category.setName(request.getName());
        }
        if(request.getDescription() != null){
            category.setDescription(request.getDescription());
        }
        if(request.getImageUrl() != null){
            category.setImageUrl(request.getImageUrl());
        }
        if(request.getSlug()!= null || request.getName()!=null){
            String newSlug = generateSlug(request.getName()!=null ? request.getName() : category.getName(),
                    request.getSlug());

            if(!newSlug.equals(category.getSlug()) && categoryrepository.existsBySlug(newSlug)){
                throw new ConflictException("Category with " + request.getSlug() + " already exists");
            }
            category.setSlug(newSlug);
        }
        categoryrepository.save(category);
        log.debug("Updated category : {}" , category.getName());

        return formatCategory(category);
    }

    @Transactional
    public Map<String, String> removeCategory(UUID id){
        Category category = categoryrepository.findById(id)
                .orElseThrow(() -> new GlobalExceptionHandler.ResourceNotFounException("Category not found"));
        categoryrepository.delete(category);
        log.debug("Removed category with id : " + id);

        return Map.of("message", "Category deleted successully");
    }
    //Helper : Slug generator
    private String generateSlug(String CategoryName, String providedSlug){
        if(providedSlug != null && !providedSlug.trim().isEmpty()){
            return providedSlug.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("-$","");
        }
        return CategoryName.trim().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("-$","");
    }

    private CategoryResponse formatCategory(Category category){
        int productCount = category.getProducts()!=null? category.getProducts().size():0;

        return  CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .slug(category.getSlug())
                .imageUrl(category.getImageUrl())
                .isActive(category.isActive())
                .productCount(productCount)
                .createdDate(category.getCreatedAt())
                .updatedDate(category.getUpdatedAt())
                .build();
    }
}
