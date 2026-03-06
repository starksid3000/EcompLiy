package com.siddharth.ecombackend.Repository;

import com.siddharth.ecombackend.Entity.Order;
import com.siddharth.ecombackend.Entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findOrderByUserId(UUID userId);
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByStatus(OrderStatus status);

}
