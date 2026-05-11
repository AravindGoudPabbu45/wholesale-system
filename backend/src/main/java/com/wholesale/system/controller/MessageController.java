package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.security.JwtUtil;
import com.wholesale.system.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Messaging controller for internal communication between all user types.
 */
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;
    private final JwtUtil jwtUtil;

    public MessageController(MessageService messageService, JwtUtil jwtUtil) {
        this.messageService = messageService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping
    public ResponseEntity<MessageResponse> send(@Valid @RequestBody MessageRequest request,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(messageService.sendMessage(userId, request));
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getConversation(@PathVariable Long otherUserId,
            HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(messageService.getConversation(userId, otherUserId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(messageService.getUnreadCount(userId));
    }

    @PutMapping("/read/{otherUserId}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long otherUserId, HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        messageService.markConversationAsRead(userId, otherUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/contacts")
    public ResponseEntity<List<Object>> getContacts(HttpServletRequest httpReq) {
        Long userId = extractUserId(httpReq);
        return ResponseEntity.ok(messageService.getContacts(userId));
    }

    private Long extractUserId(HttpServletRequest request) {
        String token = request.getHeader("Authorization").substring(7);
        return jwtUtil.extractUserId(token);
    }
}
