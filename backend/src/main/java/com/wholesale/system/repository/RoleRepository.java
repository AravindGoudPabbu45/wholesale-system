package com.wholesale.system.repository;

import com.wholesale.system.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/** Repository for Role entity */
public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByName(String name);
}
