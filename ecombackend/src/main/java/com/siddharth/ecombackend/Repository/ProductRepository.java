package com.siddharth.ecombackend.Repository;

import com.siddharth.ecombackend.Entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByIsActiveTrue();

    List<Product> findByCategoryId(UUID categoryId);

    List<Product> findByCategoryIdAndIsActiveTrue(UUID categoryId);

    Optional<Product> findBySku(String sku);

}
