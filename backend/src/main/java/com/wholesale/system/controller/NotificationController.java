package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.security.JwtUtil;
import com.wholesale.system.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * Notification controller — real-time alerts for users.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtUtil jwtUtil;

    public NotificationController(NotificationService notificationService, JwtUtil jwtUtil) {
        this.notificationService = notificationService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(HttpServletRequest req) {
        Long userId = extractUserId(req);
        return ResponseEntity.ok(notificationService.getNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(HttpServletRequest req) {
        Long userId = extractUserId(req);
        return ResponseEntity.ok(Map.of("count", notificationService.getUnreadCount(userId)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, HttpServletRequest req) {
        Long userId = extractUserId(req);
        notificationService.markRead(id, userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(HttpServletRequest req) {
        Long userId = extractUserId(req);
        notificationService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
