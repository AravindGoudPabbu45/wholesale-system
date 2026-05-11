package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Branch management service.
 * Provides CRUD operations and branch admin assignment.
 */
@Service
public class BranchService {

    private final BranchRepository branchRepo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final EmployeeRepository employeeRepo;
    private final SalesRepository salesRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public BranchService(BranchRepository branchRepo, UserRepository userRepo,
            RoleRepository roleRepo, EmployeeRepository employeeRepo,
            SalesRepository salesRepo, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.branchRepo = branchRepo;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.employeeRepo = employeeRepo;
        this.salesRepo = salesRepo;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    /** Get all active branches */
    public List<BranchResponse> getAllBranches() {
        return branchRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** Get branch by ID */
    public BranchResponse getBranchById(Long id) {
        return toResponse(findBranch(id));
    }

    /** Create a new branch. Optionally creates a BRANCH_ADMIN user. */
    @Transactional
    public BranchResponse createBranch(BranchRequest req) {
        Branch branch = Branch.builder()
                .name(req.getName())
                .location(req.getLocation())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .contactPhone(req.getContactPhone())
                .contactEmail(req.getContactEmail())
                .isActive(true)
                .build();

        // Auto-create a new BRANCH_ADMIN user if credentials provided
        if (req.getAdminUsername() != null && !req.getAdminUsername().isBlank()
                && req.getAdminPassword() != null && !req.getAdminPassword().isBlank()) {
            if (userRepo.existsByUsername(req.getAdminUsername())) {
                throw new BadRequestException("Username '" + req.getAdminUsername() + "' is already taken");
            }
            if (req.getAdminEmail() != null && userRepo.existsByEmail(req.getAdminEmail())) {
                throw new BadRequestException("Email '" + req.getAdminEmail() + "' is already registered");
            }
            Role branchAdminRole = roleRepo.findByName("BRANCH_ADMIN")
                    .orElseThrow(() -> new BadRequestException("BRANCH_ADMIN role not found"));
            User admin = User.builder()
                    .username(req.getAdminUsername())
                    .password(passwordEncoder.encode(req.getAdminPassword()))
                    .email(req.getAdminEmail() != null ? req.getAdminEmail() : req.getAdminUsername() + "@branch.local")
                    .fullName(req.getAdminFullName() != null ? req.getAdminFullName() : req.getName() + " Admin")
                    .role(branchAdminRole)
                    .status("ACTIVE")
                    .build();
            admin = userRepo.save(admin);
            branch.setAdmin(admin);

            // Send Email to the Admin with their new credentials
            emailService.sendBranchAdminCredentials(admin.getEmail(), admin.getFullName(), req.getAdminUsername(), req.getAdminPassword());

        } else if (req.getAdminId() != null) {
            User admin = userRepo.findById(req.getAdminId())
                    .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));
            branch.setAdmin(admin);
        }

        return toResponse(branchRepo.save(branch));
    }

    /** Update an existing branch */
    @Transactional
    public BranchResponse updateBranch(Long id, BranchRequest req) {
        Branch branch = findBranch(id);
        branch.setName(req.getName());
        branch.setLocation(req.getLocation());
        branch.setCity(req.getCity());
        branch.setState(req.getState());
        branch.setPincode(req.getPincode());
        branch.setContactPhone(req.getContactPhone());
        branch.setContactEmail(req.getContactEmail());
        if (req.getAdminId() != null) {
            User admin = userRepo.findById(req.getAdminId())
                    .orElseThrow(() -> new ResourceNotFoundException("Admin user not found"));
            branch.setAdmin(admin);
        }
        return toResponse(branchRepo.save(branch));
    }

    /** Deactivate a branch (soft delete) */
    @Transactional
    public void deactivateBranch(Long id) {
        Branch branch = findBranch(id);
        branch.setIsActive(false);
        branchRepo.save(branch);
    }

    /** Reactivate an inactive branch */
    @Transactional
    public BranchResponse activateBranch(Long id) {
        Branch branch = findBranch(id);
        branch.setIsActive(true);
        return toResponse(branchRepo.save(branch));
    }

    /** Permanently delete an inactive branch */
    @Transactional
    public void permanentlyDeleteBranch(Long id) {
        Branch branch = findBranch(id);
        if (branch.getIsActive()) {
            throw new BadRequestException("Cannot permanently delete an active branch. Deactivate it first.");
        }
        branch.setAdmin(null);
        branchRepo.save(branch);
        branchRepo.delete(branch);
    }

    /** Get branch analytics for super admin dashboard */
    public List<BranchAnalytics> getBranchAnalytics() {
        return branchRepo.findByIsActiveTrue().stream().map(branch -> {
            java.math.BigDecimal revenue = salesRepo.sumRevenueByBranch(branch.getId());
            java.math.BigDecimal profit = salesRepo.sumProfitByBranch(branch.getId());
            java.math.BigDecimal salaryExpense = employeeRepo.sumSalaryByBranch(branch.getId());
            long empCount = employeeRepo.findActiveByBranch(branch.getId()).size();
            return BranchAnalytics.builder()
                    .branchId(branch.getId())
                    .branchName(branch.getName())
                    .revenue(revenue != null ? revenue : java.math.BigDecimal.ZERO)
                    .profit(profit != null ? profit : java.math.BigDecimal.ZERO)
                    .employeeCount(empCount)
                    .salaryExpense(salaryExpense != null ? salaryExpense : java.math.BigDecimal.ZERO)
                    .build();
        }).collect(Collectors.toList());
    }

    private Branch findBranch(Long id) {
        return branchRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + id));
    }

    private BranchResponse toResponse(Branch b) {
        return BranchResponse.builder()
                .id(b.getId())
                .name(b.getName())
                .location(b.getLocation())
                .city(b.getCity())
                .state(b.getState())
                .pincode(b.getPincode())
                .contactPhone(b.getContactPhone())
                .contactEmail(b.getContactEmail())
                .adminId(b.getAdmin() != null ? b.getAdmin().getId() : null)
                .adminName(b.getAdmin() != null ? b.getAdmin().getFullName() : null)
                .isActive(b.getIsActive())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
