package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Internal messaging service supporting conversations between all user types.
 */
@Service
public class MessageService {

    private final MessageRepository messageRepo;
    private final UserRepository userRepo;
    private final EmployeeRepository employeeRepo;
    private final BranchRepository branchRepo;

    public MessageService(MessageRepository messageRepo, UserRepository userRepo, EmployeeRepository employeeRepo, BranchRepository branchRepo) {
        this.messageRepo = messageRepo;
        this.userRepo = userRepo;
        this.employeeRepo = employeeRepo;
        this.branchRepo = branchRepo;
    }

    /** Send a new message */
    @Transactional
    public MessageResponse sendMessage(Long senderId, MessageRequest req) {
        User sender = userRepo.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("Sender not found"));
        User receiver = userRepo.findById(req.getReceiverId())
                .orElseThrow(() -> new ResourceNotFoundException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender).receiver(receiver)
                .content(req.getContent())
                .isRead(false).build();
        return toResponse(messageRepo.save(message));
    }

    /** Get conversation between current user and another user */
    public List<MessageResponse> getConversation(Long userId, Long otherUserId) {
        return messageRepo.findConversation(userId, otherUserId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get unread message count */
    public Long getUnreadCount(Long userId) {
        return messageRepo.countUnreadMessages(userId);
    }

    /** Mark messages in a conversation as read */
    @Transactional
    public void markConversationAsRead(Long userId, Long otherUserId) {
        List<Message> messages = messageRepo.findConversation(userId, otherUserId);
        messages.stream()
                .filter(m -> m.getReceiver().getId().equals(userId) && !m.getIsRead())
                .forEach(m -> {
                    m.setIsRead(true);
                    messageRepo.save(m);
                });
    }

    /** Get all users for messaging contacts */
    public List<Object> getContacts(Long userId) {
        return userRepo.findAll().stream()
                .filter(u -> !u.getId().equals(userId) && "ACTIVE".equals(u.getStatus()))
                .map(u -> {
                    java.util.Map<String, Object> contact = new java.util.HashMap<>();
                    contact.put("id", u.getId());
                    contact.put("fullName", u.getFullName());
                    contact.put("role", u.getRole().getName());
                    contact.put("email", u.getEmail());
                    
                    if ("EMPLOYEE".equals(u.getRole().getName())) {
                        employeeRepo.findByUserId(u.getId()).ifPresent(emp -> {
                            if (emp.getBranch() != null) {
                                contact.put("branchId", emp.getBranch().getId());
                                contact.put("branchName", emp.getBranch().getName());
                            }
                        });
                    } else if ("BRANCH_ADMIN".equals(u.getRole().getName())) {
                        List<Branch> branches = branchRepo.findByAdminId(u.getId());
                        if (!branches.isEmpty()) {
                            contact.put("branchId", branches.get(0).getId());
                            contact.put("branchName", branches.get(0).getName());
                        }
                    }
                    
                    return (Object) contact;
                }).collect(Collectors.toList());
    }

    private MessageResponse toResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId()).senderId(m.getSender().getId()).senderName(m.getSender().getFullName())
                .receiverId(m.getReceiver().getId()).receiverName(m.getReceiver().getFullName())
                .content(m.getContent()).isRead(m.getIsRead()).createdAt(m.getCreatedAt())
                .build();
    }
}
