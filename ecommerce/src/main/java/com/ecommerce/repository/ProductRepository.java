package com.ecommerce.repository;

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
public interface ProductRepository extends JpaRepository<Product, UUID> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    Page<Product> findByIsActiveTrue(Pageable pageable);

    Page<Product> findByCategoryIdAndIsActiveTrue(UUID categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchActiveProducts(@Param("query") String query, Pageable pageable);

    List<Product> findByCategoryId(UUID categoryId);

    @Query("SELECT p FROM Product p WHERE p.stock < :threshold AND p.isActive = true")
    List<Product> findLowStockProducts(@Param("threshold") int threshold);
}
