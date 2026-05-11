package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * Inventory and Product controller.
 */
@RestController
@RequestMapping("/api")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // ===== PRODUCTS =====
    @GetMapping("/products")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(inventoryService.getAllProducts());
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryService.getProductById(id));
    }

    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(inventoryService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(inventoryService.updateProduct(id, request));
    }

    // ===== INVENTORY =====
    @GetMapping("/inventory/branch/{branchId}")
    public ResponseEntity<List<InventoryResponse>> getByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getInventoryByBranch(branchId));
    }

    @GetMapping("/inventory/branch/{branchId}/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStock(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getLowStockByBranch(branchId));
    }

    @GetMapping("/inventory/low-stock")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<InventoryResponse>> getAllLowStock() {
        return ResponseEntity.ok(inventoryService.getAllLowStock());
    }

    // ===== STOCK MOVEMENTS =====
    @GetMapping("/inventory/branch/{branchId}/movements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<StockMovementResponse>> getStockMovements(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getAllStockMovements(branchId));
    }

    @GetMapping("/inventory/branch/{branchId}/product/{productId}/movements")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<List<StockMovementResponse>> getProductMovements(
            @PathVariable Long branchId, @PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getStockMovements(branchId, productId));
    }

    // ===== INVENTORY ACTIONS =====
    @PostMapping("/inventory/adjust")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE')")
    public ResponseEntity<String> adjustStock(@Valid @RequestBody InventoryAdjustRequest request) {
        inventoryService.adjustStock(request);
        return ResponseEntity.ok("Stock adjusted successfully");
    }

    @PutMapping("/products/{id}/threshold")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_ADMIN')")
    public ResponseEntity<String> updateThreshold(@PathVariable Long id, @Valid @RequestBody ThresholdUpdateRequest request) {
        request.setProductId(id);
        inventoryService.updateThreshold(request);
        return ResponseEntity.ok("Threshold updated successfully");
    }
}
