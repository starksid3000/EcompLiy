package com.ecommerce.repository;

import com.ecommerce.entity.Category;
import com.ecommerce.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {

    Optional<Category> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Category> findByIsActiveTrue();

    Page<Category> findByIsActive(Boolean isActive, Pageable pageable);

    @Query("SELECT c FROM Category c WHERE c.isActive = true AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Category> searchCategories(@Param("query") String query, Pageable pageable);
}
