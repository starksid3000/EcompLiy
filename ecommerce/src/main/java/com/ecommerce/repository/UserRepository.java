package com.ecommerce.repository;

import com.ecommerce.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByRefreshToken(String refreshToken);

    @Modifying
    @Query("UPDATE User u SET u.refreshToken = :token WHERE u.id = :id")
    void updateRefreshToken(@Param("id") UUID id, @Param("token") String token);

    @Modifying
    @Query("UPDATE User u SET u.refreshToken = NULL WHERE u.id = :id")
    void clearRefreshToken(@Param("id") UUID id);
}
