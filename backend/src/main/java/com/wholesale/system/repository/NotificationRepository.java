package com.wholesale.system.repository;

import com.wholesale.system.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/** Repository for Notification entity */
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findTop50ByUserIdOrderByCreatedAtDesc(Long userId);

    Long countByUserIdAndIsReadFalse(Long userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);
}
