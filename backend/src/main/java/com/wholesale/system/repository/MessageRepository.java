package com.wholesale.system.repository;

import com.wholesale.system.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

/** Repository for Message entity */
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Get conversation between two users, ordered chronologically */
    @Query("SELECT m FROM Message m WHERE " +
            "((m.sender.id = :userId1 AND m.receiver.id = :userId2 AND m.isDeletedSender = false) OR " +
            "(m.sender.id = :userId2 AND m.receiver.id = :userId1 AND m.isDeletedReceiver = false)) " +
            "ORDER BY m.createdAt ASC")
    List<Message> findConversation(Long userId1, Long userId2);

    /** Get unread message count for a user */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.receiver.id = :userId AND m.isRead = false AND m.isDeletedReceiver = false")
    Long countUnreadMessages(Long userId);

    /** Get all unique conversation partners for a user */
    @Query("SELECT DISTINCT CASE WHEN m.sender.id = :userId THEN m.receiver ELSE m.sender END " +
            "FROM Message m WHERE (m.sender.id = :userId AND m.isDeletedSender = false) OR " +
            "(m.receiver.id = :userId AND m.isDeletedReceiver = false)")
    List<Object> findConversationPartners(Long userId);
}
