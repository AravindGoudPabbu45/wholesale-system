package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.exception.*;
import com.wholesale.system.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Inventory service providing stock views, low stock alerts, and stock movement
 * logs.
 * Stock changes happen ONLY through OrderService (packing) and
 * ProcurementService (delivery).
 */
@Service
public class InventoryService {

    private final InventoryRepository inventoryRepo;
    private final StockMovementLogRepository stockLogRepo;
    private final ProductRepository productRepo;

    public InventoryService(InventoryRepository inventoryRepo,
            StockMovementLogRepository stockLogRepo,
            ProductRepository productRepo) {
        this.inventoryRepo = inventoryRepo;
        this.stockLogRepo = stockLogRepo;
        this.productRepo = productRepo;
    }

    /** Get all inventory for a branch */
    public List<InventoryResponse> getInventoryByBranch(Long branchId) {
        return inventoryRepo.findByBranchId(branchId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get low stock items for a branch */
    public List<InventoryResponse> getLowStockByBranch(Long branchId) {
        return inventoryRepo.findLowStockByBranch(branchId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get all low stock items across all branches */
    public List<InventoryResponse> getAllLowStock() {
        return inventoryRepo.findAllLowStock().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /** Get stock movement logs for a product at a branch */
    public List<StockMovementResponse> getStockMovements(Long branchId, Long productId) {
        return stockLogRepo.findByBranchIdAndProductIdOrderByCreatedAtDesc(branchId, productId).stream()
                .map(this::toMovementResponse).collect(Collectors.toList());
    }

    /** Get all stock movement logs for a branch */
    public List<StockMovementResponse> getAllStockMovements(Long branchId) {
        return stockLogRepo.findByBranchIdOrderByCreatedAtDesc(branchId).stream()
                .map(this::toMovementResponse).collect(Collectors.toList());
    }

    /** Get all products */
    @Cacheable(value = "products", key = "'all-active'")
    public List<ProductResponse> getAllProducts() {
        return productRepo.findByIsActiveTrue().stream()
                .map(this::toProductResponse).collect(Collectors.toList());
    }

    /** Get product by ID */
    public ProductResponse getProductById(Long id) {
        Product p = productRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toProductResponse(p);
    }

    /** Create a new product */
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse createProduct(ProductRequest req) {
        if (productRepo.existsBySku(req.getSku())) {
            throw new BadRequestException("Product SKU already exists: " + req.getSku());
        }
        Product product = Product.builder()
                .name(req.getName()).sku(req.getSku()).category(req.getCategory())
                .description(req.getDescription()).price(req.getPrice())
                .costPrice(req.getCostPrice())
                .unit(req.getUnit() != null ? req.getUnit() : "PCS")
                .thresholdLevel(req.getThresholdLevel() != null ? req.getThresholdLevel() : 10)
                .leadTime(req.getLeadTime() != null ? req.getLeadTime() : 7)
                .safetyStock(req.getSafetyStock() != null ? req.getSafetyStock() : 5)
                .isActive(true).build();
        return toProductResponse(productRepo.save(product));
    }

    /** Update a product */
    @CacheEvict(value = "products", allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest req) {
        Product p = productRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        p.setName(req.getName());
        if (req.getSku() != null)
            p.setSku(req.getSku());
        if (req.getCategory() != null)
            p.setCategory(req.getCategory());
        if (req.getDescription() != null)
            p.setDescription(req.getDescription());
        if (req.getPrice() != null)
            p.setPrice(req.getPrice());
        if (req.getCostPrice() != null)
            p.setCostPrice(req.getCostPrice());
        if (req.getUnit() != null)
            p.setUnit(req.getUnit());
        if (req.getThresholdLevel() != null)
            p.setThresholdLevel(req.getThresholdLevel());
        if (req.getLeadTime() != null)
            p.setLeadTime(req.getLeadTime());
        if (req.getSafetyStock() != null)
            p.setSafetyStock(req.getSafetyStock());
        return toProductResponse(productRepo.save(p));
    }

    private InventoryResponse toResponse(Inventory inv) {
        Product p = inv.getProduct();
        return InventoryResponse.builder()
                .id(inv.getId()).branchId(inv.getBranch().getId()).branchName(inv.getBranch().getName())
                .productId(p.getId()).productName(p.getName()).sku(p.getSku()).category(p.getCategory())
                .quantity(inv.getQuantity()).thresholdLevel(p.getThresholdLevel())
                .isLowStock(inv.getQuantity() <= p.getThresholdLevel())
                .lastUpdated(inv.getLastUpdated()).build();
    }

    private StockMovementResponse toMovementResponse(StockMovementLog log) {
        return StockMovementResponse.builder()
                .id(log.getId()).productId(log.getProduct().getId()).productName(log.getProduct().getName())
                .changeType(log.getChangeType()).quantityChanged(log.getQuantityChanged())
                .quantityBefore(log.getQuantityBefore()).quantityAfter(log.getQuantityAfter())
                .referenceType(log.getReferenceType()).referenceId(log.getReferenceId())
                .changedByName(log.getChangedBy() != null ? log.getChangedBy().getFullName() : null)
                .createdAt(log.getCreatedAt()).build();
    }

    private ProductResponse toProductResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId()).name(p.getName()).sku(p.getSku()).category(p.getCategory())
                .description(p.getDescription()).price(p.getPrice()).costPrice(p.getCostPrice())
                .unit(p.getUnit()).thresholdLevel(p.getThresholdLevel())
                .leadTime(p.getLeadTime()).safetyStock(p.getSafetyStock())
                .isActive(p.getIsActive()).build();
    }

    /** Manually adjust stock quantity (add or subtract) */
    public void adjustStock(InventoryAdjustRequest req) {
        Product product = productRepo.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        Inventory inv = inventoryRepo.findByBranchIdAndProductId(req.getBranchId(), req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory record not found"));

        int before = inv.getQuantity();
        int after = before + req.getQuantity();
        if (after < 0) throw new BadRequestException("Cannot reduce stock below zero. Current: " + before);

        inv.setQuantity(after);
        inv.setLastUpdated(java.time.LocalDateTime.now());
        inventoryRepo.save(inv);

        // Log the movement
        StockMovementLog log = StockMovementLog.builder()
                .product(product)
                .branch(inv.getBranch())
                .changeType(req.getQuantity() >= 0 ? "MANUAL_ADDITION" : "MANUAL_DEDUCTION")
                .quantityChanged(Math.abs(req.getQuantity()))
                .quantityBefore(before)
                .quantityAfter(after)
                .referenceType("MANUAL")
                .referenceId(0L)
                .build();
        stockLogRepo.save(log);
    }

    /** Update reorder threshold for a product */
    public void updateThreshold(ThresholdUpdateRequest req) {
        Product product = productRepo.findById(req.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setThresholdLevel(req.getThresholdLevel());
        productRepo.save(product);
    }
}
