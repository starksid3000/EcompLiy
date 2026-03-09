package com.ecommerce.repository;

import com.ecommerce.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CartRepository extends JpaRepository<Cart, UUID> {

    List<Cart> findByUserId(UUID userId);

    // Find active (not checked out) cart for a user
    Optional<Cart> findByUserIdAndCheckedOutFalse(UUID userId);

    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems ci LEFT JOIN FETCH ci.product WHERE c.id = :id")
    Optional<Cart> findByIdWithItems(@Param("id") UUID id);

    @Query("SELECT c FROM Cart c LEFT JOIN FETCH c.cartItems ci LEFT JOIN FETCH ci.product " +
           "WHERE c.user.id = :userId AND c.checkedOut = false")
    Optional<Cart> findActiveCartWithItemsByUserId(@Param("userId") UUID userId);
}
