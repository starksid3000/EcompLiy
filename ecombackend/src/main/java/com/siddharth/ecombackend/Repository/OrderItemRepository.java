package com.siddharth.ecombackend.Repository;

import com.siddharth.ecombackend.Entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByProductId(UUID productId);
}


