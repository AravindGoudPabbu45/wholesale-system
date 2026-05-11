package com.wholesale.system.config;

import com.wholesale.system.entity.AuditLog;
import com.wholesale.system.repository.AuditLogRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Audit Aspect — uses Spring AOP to automatically log changes to critical entities.
 * Tracks: Inventory modifications, Order status changes, Product updates, Branch changes.
 */
@Aspect
@Component
public class AuditAspect {

    private final AuditLogRepository auditLogRepo;

    public AuditAspect(AuditLogRepository auditLogRepo) {
        this.auditLogRepo = auditLogRepo;
    }

    // ======== INVENTORY CHANGES ========

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.InventoryService.updateStock(..))",
        returning = "result")
    public void afterInventoryUpdate(JoinPoint jp, Object result) {
        Object[] args = jp.getArgs();
        logAudit("INVENTORY", extractId(args, 0), "STOCK_UPDATE",
                "Stock updated for branch=" + safeArg(args, 0) + " product=" + safeArg(args, 1));
    }

    // ======== ORDER STATUS CHANGES ========

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.OrderService.updateOrderStatus(..))",
        returning = "result")
    public void afterOrderStatusChange(JoinPoint jp, Object result) {
        Object[] args = jp.getArgs();
        logAudit("ORDER", extractId(args, 0), "STATUS_CHANGE",
                "Order status updated to " + safeArg(args, 1));
    }

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.OrderService.placeOrder(..))",
        returning = "result")
    public void afterOrderCreated(JoinPoint jp, Object result) {
        logAudit("ORDER", null, "CREATE", "New order placed");
    }

    // ======== PRODUCT CHANGES ========

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.InventoryService.createProduct(..))",
        returning = "result")
    public void afterProductCreated(JoinPoint jp, Object result) {
        logAudit("PRODUCT", null, "CREATE", "New product created");
    }

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.InventoryService.updateProduct(..))",
        returning = "result")
    public void afterProductUpdated(JoinPoint jp, Object result) {
        Object[] args = jp.getArgs();
        logAudit("PRODUCT", extractId(args, 0), "UPDATE", "Product details updated");
    }

    // ======== BRANCH CHANGES ========

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.BranchService.createBranch(..))",
        returning = "result")
    public void afterBranchCreated(JoinPoint jp, Object result) {
        logAudit("BRANCH", null, "CREATE", "New branch created");
    }

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.BranchService.deactivateBranch(..))")
    public void afterBranchDeactivated(JoinPoint jp) {
        Object[] args = jp.getArgs();
        logAudit("BRANCH", extractId(args, 0), "DEACTIVATE", "Branch deactivated");
    }

    // ======== EMPLOYEE CHANGES ========

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.EmployeeService.addEmployee(..))",
        returning = "result")
    public void afterEmployeeAdded(JoinPoint jp, Object result) {
        logAudit("EMPLOYEE", null, "CREATE", "New employee added");
    }

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.EmployeeService.deactivateEmployee(..))")
    public void afterEmployeeDeactivated(JoinPoint jp) {
        Object[] args = jp.getArgs();
        logAudit("EMPLOYEE", extractId(args, 0), "DEACTIVATE", "Employee deactivated");
    }

    // ======== PROCUREMENT CHANGES ========

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.ProcurementService.createProcurementOrder(..))",
        returning = "result")
    public void afterProcurementCreated(JoinPoint jp, Object result) {
        logAudit("PROCUREMENT", null, "CREATE", "Procurement order created");
    }

    @AfterReturning(
        pointcut = "execution(* com.wholesale.system.service.ProcurementService.updateProcurementStatus(..))",
        returning = "result")
    public void afterProcurementStatusChange(JoinPoint jp, Object result) {
        Object[] args = jp.getArgs();
        logAudit("PROCUREMENT", extractId(args, 0), "STATUS_CHANGE",
                "Procurement status changed to " + safeArg(args, 1));
    }

    // ======== HELPERS ========

    private void logAudit(String entityType, Long entityId, String action, String description) {
        try {
            String username = "SYSTEM";
            String role = "SYSTEM";
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                username = auth.getName();
                role = auth.getAuthorities().stream()
                        .findFirst().map(a -> a.getAuthority().replace("ROLE_", ""))
                        .orElse("UNKNOWN");
            }
            auditLogRepo.save(AuditLog.builder()
                    .entityType(entityType)
                    .entityId(entityId)
                    .action(action)
                    .changedBy(username)
                    .changedByRole(role)
                    .description(description)
                    .build());
        } catch (Exception e) {
            // Audit logging should never break the actual operation
            System.err.println("Audit log failed: " + e.getMessage());
        }
    }

    private Long extractId(Object[] args, int index) {
        if (args != null && args.length > index && args[index] instanceof Long) {
            return (Long) args[index];
        }
        return null;
    }

    private String safeArg(Object[] args, int index) {
        if (args != null && args.length > index && args[index] != null) {
            return args[index].toString();
        }
        return "N/A";
    }
}
