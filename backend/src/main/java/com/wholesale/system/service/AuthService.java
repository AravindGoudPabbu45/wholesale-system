package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import com.wholesale.system.security.JwtUtil;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication service handling user registration and login.
 * Supports registration for all roles with role-specific profile creation.
 */
@Service
public class AuthService {

    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final RetailerRepository retailerRepo;
    private final SupplierRepository supplierRepo;
    private final EmployeeRepository employeeRepo;
    private final BranchRepository branchRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    public AuthService(UserRepository userRepo, RoleRepository roleRepo,
            RetailerRepository retailerRepo, SupplierRepository supplierRepo,
            EmployeeRepository employeeRepo, BranchRepository branchRepo,
            PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
            AuthenticationManager authManager) {
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.retailerRepo = retailerRepo;
        this.supplierRepo = supplierRepo;
        this.employeeRepo = employeeRepo;
        this.branchRepo = branchRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authManager = authManager;
    }

    /**
     * Register a new user. Creates role-specific profiles (Retailer/Supplier).
     */
    @Transactional
    public AuthResponse register(RegisterRequest req) {
        // Validate uniqueness
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Find role
        Role role = roleRepo.findByName(req.getRole())
                .orElseThrow(() -> new BadRequestException("Invalid role: " + req.getRole()));

        String initialStatus = "ACTIVE";
        if ("RETAILER".equals(req.getRole()) || "SUPPLIER".equals(req.getRole())) {
            initialStatus = "PENDING";
        }

        // Create user
        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(role)
                .status(initialStatus)
                .build();
        user = userRepo.save(user);

        // Create role-specific profile
        if ("RETAILER".equals(req.getRole())) {
            Retailer retailer = Retailer.builder()
                    .user(user)
                    .businessName(req.getBusinessName() != null ? req.getBusinessName() : req.getFullName())
                    .gstNumber(req.getGstNumber())
                    .businessLicenseNo(req.getBusinessLicenseNo())
                    .businessType(req.getBusinessType())
                    .yearsInBusiness(req.getYearsInBusiness())
                    .alternatePhone(req.getAlternatePhone())
                    .address(req.getAddress())
                    .city(req.getCity())
                    .state(req.getState())
                    .pincode(req.getPincode())
                    .approvalStatus("PENDING")
                    .build();
            retailerRepo.save(retailer);
        } else if ("SUPPLIER".equals(req.getRole())) {
            Supplier supplier = Supplier.builder()
                    .user(user)
                    .companyName(req.getCompanyName() != null ? req.getCompanyName() : req.getFullName())
                    .contactPerson(req.getContactPerson())
                    .phone(req.getPhone())
                    .email(req.getEmail())
                    .gstNumber(req.getGstNumber())
                    .businessLicenseNo(req.getBusinessLicenseNo())
                    .businessType(req.getBusinessType())
                    .yearsInBusiness(req.getYearsInBusiness())
                    .alternatePhone(req.getAlternatePhone())
                    .address(req.getAddress())
                    .city(req.getCity())
                    .state(req.getState())
                    .pincode(req.getPincode())
                    .build();
            supplierRepo.save(supplier);
        }

        // Generate token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), role.getName());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(role.getName())
                .build();
    }

    /**
     * Login with username and password. Returns JWT token with user details.
     */
    public AuthResponse login(LoginRequest req) {
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid username or password");
        }

        User user = userRepo.findByUsername(req.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if ("PENDING".equals(user.getStatus())) {
            throw new BadRequestException("Account pending admin approval. Please wait to be approved as a legitimate business partner.");
        } else if (!"ACTIVE".equals(user.getStatus())) {
            throw new BadRequestException("Account is deactivated. Contact admin.");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername(), user.getRole().getName());

        // Build response with role-specific info
        AuthResponse.AuthResponseBuilder responseBuilder = AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName());

        // Add branch info for employees and branch admins
        if ("EMPLOYEE".equals(user.getRole().getName())) {
            employeeRepo.findByUserId(user.getId()).ifPresent(emp -> {
                responseBuilder.branchId(emp.getBranch().getId());
                responseBuilder.branchName(emp.getBranch().getName());
                responseBuilder.department(emp.getDepartment());
            });
        } else if ("BRANCH_ADMIN".equals(user.getRole().getName())) {
            branchRepo.findByAdminId(user.getId()).stream().findFirst().ifPresent(branch -> {
                responseBuilder.branchId(branch.getId());
                responseBuilder.branchName(branch.getName());
            });
        }

        return responseBuilder.build();
    }
}
