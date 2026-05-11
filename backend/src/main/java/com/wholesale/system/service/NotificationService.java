package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * NotificationService — dispatches real-time alerts to users.
 * Called by OrderService, ProcurementService, FinanceService when events occur.
 */
@Service
public class NotificationService {

    private final NotificationRepository notifRepo;
    private final UserRepository userRepo;
    private final EmployeeRepository employeeRepo;

    public NotificationService(NotificationRepository notifRepo, UserRepository userRepo,
            EmployeeRepository employeeRepo) {
        this.notifRepo = notifRepo;
        this.userRepo = userRepo;
        this.employeeRepo = employeeRepo;
    }

    /** Send notification to a specific user */
    public void notify(Long userId, String title, String message, String type,
            String referenceType, Long referenceId) {
        User user = userRepo.findById(userId).orElse(null);
        if (user == null) return;

        Notification notif = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        notifRepo.save(notif);
    }

    /** Broadcast notification to all users of a specific role */
    public void notifyRole(String roleName, String title, String message, String type,
            String referenceType, Long referenceId) {
        List<User> users = userRepo.findByRoleName(roleName);
        for (User user : users) {
            notify(user.getId(), title, message, type, referenceType, referenceId);
        }
    }

    /** Notify all employees at a specific branch (optionally filtered by department) */
    public void notifyBranchEmployees(Long branchId, String department, String title,
            String message, String type, String referenceType, Long referenceId) {
        List<Employee> employees;
        if (department != null) {
            employees = employeeRepo.findByBranchIdAndDepartment(branchId, department);
        } else {
            employees = employeeRepo.findActiveByBranch(branchId);
        }
        for (Employee emp : employees) {
            notify(emp.getUser().getId(), title, message, type, referenceType, referenceId);
        }
    }

    /** Get notifications for a user (latest 50) */
    public List<NotificationResponse> getNotifications(Long userId) {
        return notifRepo.findTop50ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get unread count */
    public Long getUnreadCount(Long userId) {
        return notifRepo.countByUserIdAndIsReadFalse(userId);
    }

    /** Mark a single notification as read */
    @Transactional
    public void markRead(Long notificationId, Long userId) {
        Notification notif = notifRepo.findById(notificationId).orElse(null);
        if (notif != null && notif.getUser().getId().equals(userId)) {
            notif.setIsRead(true);
            notifRepo.save(notif);
        }
    }

    /** Mark all notifications as read for a user */
    @Transactional
    public void markAllRead(Long userId) {
        List<Notification> unread = notifRepo.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        for (Notification n : unread) {
            n.setIsRead(true);
        }
        notifRepo.saveAll(unread);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .referenceType(n.getReferenceType())
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
