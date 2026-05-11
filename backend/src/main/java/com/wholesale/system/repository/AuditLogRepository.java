package com.wholesale.system.repository;

import com.wholesale.system.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

/** Repository for AuditLog entity with pagination support */
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType, Pageable pageable);

    Page<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, Long entityId, Pageable pageable);

    Page<AuditLog> findByChangedByOrderByTimestampDesc(String changedBy, Pageable pageable);

    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);

    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
}
