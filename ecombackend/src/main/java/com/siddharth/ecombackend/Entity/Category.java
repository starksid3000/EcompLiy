package com.siddharth.ecombackend.Entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
@Entity
@Table(
        name = "category",
        indexes = {
                @Index(name = "idx_slug", columnList = "slug"),
                @Index(name = "idx_is_active", columnList = "isActive")
        }
)
public class Category {

    @Id
    @GeneratedValue
    private UUID id;

    private String name;

    @Column(nullable = true)
    private String description;

    @Column(unique = true)
    private String slug;

    @Column(nullable = true)
    private String imageUrl;

    private Boolean isActive = true;

    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL)
    private List<Product> products;

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