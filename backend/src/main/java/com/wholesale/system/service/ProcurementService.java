package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Procurement service managing purchase orders to suppliers.
 * Handles the procurement lifecycle: REQUESTED → CONFIRMED → SHIPPED →
 * DELIVERED
 * Automatically increases inventory when supplier delivery is confirmed.
 */
@Service
public class ProcurementService {

    private final ProcurementOrderRepository procurementRepo;
    private final BranchRepository branchRepo;
    private final SupplierRepository supplierRepo;
    private final ProductRepository productRepo;
    private final InventoryRepository inventoryRepo;
    private final StockMovementLogRepository stockLogRepo;
    private final UserRepository userRepo;

    public ProcurementService(ProcurementOrderRepository procurementRepo, BranchRepository branchRepo,
            SupplierRepository supplierRepo, ProductRepository productRepo,
            InventoryRepository inventoryRepo, StockMovementLogRepository stockLogRepo,
            UserRepository userRepo) {
        this.procurementRepo = procurementRepo;
        this.branchRepo = branchRepo;
        this.supplierRepo = supplierRepo;
        this.productRepo = productRepo;
        this.inventoryRepo = inventoryRepo;
        this.stockLogRepo = stockLogRepo;
        this.userRepo = userRepo;
    }

    /** Create a new procurement order */
    @Transactional
    public ProcurementResponse createProcurement(Long userId, ProcurementRequest req) {
        Branch branch = branchRepo.findById(req.getBranchId())
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found"));
        Supplier supplier = supplierRepo.findById(req.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));
        Product product = productRepo.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        User user = userRepo.findById(userId).orElse(null);

        ProcurementOrder po = ProcurementOrder.builder()
                .branch(branch).supplier(supplier).product(product)
                .quantity(req.getQuantity())
                .expectedDate(req.getExpectedDate())
                .status("REQUESTED")
                .createdBy(user)
                .notes(req.getNotes())
                .build();
        return toResponse(procurementRepo.save(po));
    }

    /** Update procurement order status */
    @Transactional
    public ProcurementResponse updateProcurementStatus(Long id, String status, Long userId) {
        ProcurementOrder po = procurementRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Procurement order not found"));
        po.setStatus(status);

        // When delivered, auto-increase inventory
        if ("DELIVERED".equals(status)) {
            po.setActualDeliveryDate(LocalDate.now());
            increaseInventory(po, userId);
        }

        return toResponse(procurementRepo.save(po));
    }

    /** Auto-increase inventory when supplier delivers goods */
    private void increaseInventory(ProcurementOrder po, Long userId) {
        Inventory inventory = inventoryRepo.findByBranchIdAndProductId(
                po.getBranch().getId(), po.getProduct().getId())
                .orElse(Inventory.builder()
                        .branch(po.getBranch())
                        .product(po.getProduct())
                        .quantity(0)
                        .build());

        int before = inventory.getQuantity();
        int after = before + po.getQuantity();
        inventory.setQuantity(after);
        inventoryRepo.save(inventory);

        User user = userId != null ? userRepo.findById(userId).orElse(null) : null;
        StockMovementLog log = StockMovementLog.builder()
                .branch(po.getBranch()).product(po.getProduct())
                .changeType("SUPPLIER_DELIVERY")
                .quantityChanged(po.getQuantity())
                .quantityBefore(before).quantityAfter(after)
                .referenceType("PROCUREMENT").referenceId(po.getId())
                .changedBy(user)
                .notes("Supplier delivery for PO #" + po.getId())
                .build();
        stockLogRepo.save(log);
    }

    public List<ProcurementResponse> getByBranch(Long branchId) {
        return procurementRepo.findByBranchId(branchId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProcurementResponse> getBySupplier(Long supplierId) {
        return procurementRepo.findBySupplierId(supplierId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ProcurementResponse> getAll() {
        return procurementRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    private ProcurementResponse toResponse(ProcurementOrder po) {
        return ProcurementResponse.builder()
                .id(po.getId()).branchId(po.getBranch().getId()).branchName(po.getBranch().getName())
                .supplierId(po.getSupplier().getId()).supplierName(po.getSupplier().getCompanyName())
                .productId(po.getProduct().getId()).productName(po.getProduct().getName()).sku(po.getProduct().getSku())
                .quantity(po.getQuantity()).expectedDate(po.getExpectedDate())
                .actualDeliveryDate(po.getActualDeliveryDate())
                .status(po.getStatus()).notes(po.getNotes()).createdAt(po.getCreatedAt())
                .build();
    }
}
