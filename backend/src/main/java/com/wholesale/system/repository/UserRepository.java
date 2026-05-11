package com.wholesale.system.repository;

import com.wholesale.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

/** Repository for User entity */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName")
    List<User> findByRoleName(String roleName);

    @Query("SELECT u FROM User u WHERE u.role.name = :roleName AND u.status = 'ACTIVE'")
    List<User> findActiveByRoleName(String roleName);
}
