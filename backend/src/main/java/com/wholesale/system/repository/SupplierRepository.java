package com.wholesale.system.repository;

import com.wholesale.system.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

/** Repository for Supplier entity */
public interface SupplierRepository extends JpaRepository<Supplier, Long> {
    Optional<Supplier> findByUserId(Long userId);

    List<Supplier> findByStatus(String status);
}
