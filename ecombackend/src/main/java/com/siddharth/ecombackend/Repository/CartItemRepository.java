package com.siddharth.ecombackend.Repository;

import com.siddharth.ecombackend.Entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CartItemRepository extends JpaRepository<CartItem, UUID> {
    List<CartItem> findByProductId(UUID productId);
}
