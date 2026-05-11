package com.wholesale.system.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Role entity - Defines system roles (SUPER_ADMIN, BRANCH_ADMIN, EMPLOYEE, RETAILER, SUPPLIER).
 */
@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;
}
