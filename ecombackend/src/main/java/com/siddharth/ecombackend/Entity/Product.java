package com.siddharth.ecombackend.Entity;


import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "products",
        indexes = {
                @Index(name = "idx_sku", columnList = "sku"),
                @Index(name = "idx_category_id", columnList = "category_id"),
                @Index(name = "idx_is_active", columnList = "isActive")
        }
)
public class Product {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @Column(nullable = true)
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    private int stock = 0;

    @Column(unique = true)
    private String sku;

    @Column(nullable = true)
    private String imageUrl;

    private Boolean isActive = true;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<OrderItem> orderItems;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<CartItem> cartItems;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}