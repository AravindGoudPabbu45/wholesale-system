package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Employee management controller - Branch Admin operations.
 */
@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<EmployeeResponse>> getAll() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<EmployeeResponse>> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(employeeService.getEmployeesByBranch(branchId));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<EmployeeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<EmployeeResponse> add(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.addEmployee(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<EmployeeResponse> update(@PathVariable Long id, @RequestBody EmployeeUpdateRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        employeeService.deactivateEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<EmployeeResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.activateEmployee(id));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> permanentDelete(@PathVariable Long id) {
        employeeService.permanentlyDeleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/branch/{branchId}/department/{department}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<List<EmployeeResponse>> getByDepartment(@PathVariable Long branchId,
            @PathVariable String department) {
        return ResponseEntity.ok(employeeService.getByDepartment(branchId, department));
    }
}
