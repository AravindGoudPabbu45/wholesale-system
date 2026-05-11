package com.wholesale.system.repository;

import com.wholesale.system.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/** Repository for Product entity */
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySku(String sku);

    List<Product> findByCategory(String category);

    List<Product> findByIsActiveTrue();

    boolean existsBySku(String sku);
}
