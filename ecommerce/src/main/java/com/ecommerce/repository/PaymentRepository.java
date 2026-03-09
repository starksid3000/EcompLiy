package com.ecommerce.repository;

import com.ecommerce.entity.Payment;
import com.ecommerce.entity.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByOrderId(UUID orderId);

    Optional<Payment> findByTransactionId(String transactionId);

    Page<Payment> findByUserId(UUID userId, Pageable pageable);

    List<Payment> findByStatus(PaymentStatus status);
}
