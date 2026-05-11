package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Employee management service - full CRUD with soft delete, salary management,
 * and department assignment. Used by Branch Admin.
 */
@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepo;
    private final UserRepository userRepo;
    private final RoleRepository roleRepo;
    private final BranchRepository branchRepo;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(EmployeeRepository employeeRepo, UserRepository userRepo,
            RoleRepository roleRepo, BranchRepository branchRepo,
            PasswordEncoder passwordEncoder) {
        this.employeeRepo = employeeRepo;
        this.userRepo = userRepo;
        this.roleRepo = roleRepo;
        this.branchRepo = branchRepo;
        this.passwordEncoder = passwordEncoder;
    }

    /** Get all employees for a branch */
    public List<EmployeeResponse> getEmployeesByBranch(Long branchId) {
        return employeeRepo.findByBranchId(branchId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get all employees across all branches */
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepo.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get employee by ID */
    public EmployeeResponse getEmployeeById(Long id) {
        return toResponse(findEmployee(id));
    }

    /** Add a new employee - creates user account and employee record */
    @Transactional
    public EmployeeResponse addEmployee(EmployeeRequest req) {
        if (userRepo.existsByUsername(req.getUsername())) {
            throw new BadRequestException("Username already taken");
        }
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        Branch branch = branchRepo.findById(req.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));

        Role role = roleRepo.findByName("EMPLOYEE")
                .orElseThrow(() -> new ResourceNotFoundException("Employee role not found"));

        // Create user account
        User user = User.builder()
                .username(req.getUsername())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .phone(req.getPhone())
                .role(role)
                .status("ACTIVE")
                .build();
        user = userRepo.save(user);

        // Create employee record
        Employee employee = Employee.builder()
                .user(user)
                .branch(branch)
                .department(req.getDepartment())
                .designation(req.getDesignation())
                .salary(req.getSalary())
                .status("ACTIVE")
                .joiningDate(req.getJoiningDate() != null ? req.getJoiningDate() : LocalDate.now())
                .build();

        return toResponse(employeeRepo.save(employee));
    }

    /** Update employee details */
    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest req) {
        Employee employee = findEmployee(id);
        User user = employee.getUser();

        if (req.getFullName() != null)
            user.setFullName(req.getFullName());
        if (req.getPhone() != null)
            user.setPhone(req.getPhone());
        if (req.getDepartment() != null)
            employee.setDepartment(req.getDepartment());
        if (req.getDesignation() != null)
            employee.setDesignation(req.getDesignation());
        if (req.getSalary() != null)
            employee.setSalary(req.getSalary());
        if (req.getStatus() != null) {
            employee.setStatus(req.getStatus());
            user.setStatus(req.getStatus());
        }

        userRepo.save(user);
        return toResponse(employeeRepo.save(employee));
    }

    /** Soft delete an employee (set status to INACTIVE) */
    @Transactional
    public void deactivateEmployee(Long id) {
        Employee employee = findEmployee(id);
        employee.setStatus("INACTIVE");
        employee.getUser().setStatus("INACTIVE");
        employeeRepo.save(employee);
        userRepo.save(employee.getUser());
    }

    /** Activate an inactive employee */
    @Transactional
    public EmployeeResponse activateEmployee(Long id) {
        Employee employee = findEmployee(id);
        employee.setStatus("ACTIVE");
        employee.getUser().setStatus("ACTIVE");
        userRepo.save(employee.getUser());
        return toResponse(employeeRepo.save(employee));
    }

    /** Get employees filtered by department */
    public List<EmployeeResponse> getByDepartment(Long branchId, String department) {
        return employeeRepo.findByBranchIdAndDepartment(branchId, department).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Permanently delete an inactive employee */
    @Transactional
    public void permanentlyDeleteEmployee(Long id) {
        Employee employee = findEmployee(id);
        if ("ACTIVE".equals(employee.getStatus())) {
            throw new BadRequestException("Cannot permanently delete an active employee. Deactivate them first.");
        }
        User user = employee.getUser();
        employeeRepo.delete(employee);
        
        // Prevent deleting admin users if they still govern a branch
        List<Branch> branches = branchRepo.findByAdminId(user.getId());
        for (Branch b : branches) {
            b.setAdmin(null);
            branchRepo.save(b);
        }
        userRepo.delete(user);
    }

    private Employee findEmployee(Long id) {
        return employeeRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));
    }

    private EmployeeResponse toResponse(Employee e) {
        return EmployeeResponse.builder()
                .id(e.getId())
                .userId(e.getUser().getId())
                .username(e.getUser().getUsername())
                .fullName(e.getUser().getFullName())
                .email(e.getUser().getEmail())
                .phone(e.getUser().getPhone())
                .branchId(e.getBranch().getId())
                .branchName(e.getBranch().getName())
                .department(e.getDepartment())
                .designation(e.getDesignation())
                .salary(e.getSalary())
                .status(e.getStatus())
                .joiningDate(e.getJoiningDate())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
