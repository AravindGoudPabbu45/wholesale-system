package com.wholesale.system.service;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.entity.*;
import com.wholesale.system.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OrderTrackingService — manages Amazon-style tracking history for orders.
 * Records tracking events at each status change with location metadata.
 */
@Service
public class OrderTrackingService {

    private final OrderTrackingRepository trackingRepo;
    private final OrderRepository orderRepo;

    /** Location descriptions for each status stage */
    private static final Map<String, String> DEFAULT_LOCATIONS = Map.of(
        "PENDING", "Order Received",
        "APPROVED", "Order Confirmed — Warehouse Notified",
        "PACKED", "Packed at Warehouse",
        "SHIPPED", "Left Warehouse — Dispatched to Carrier",
        "IN_TRANSIT", "Reached Regional Hub",
        "NEARBY", "Arrived at Local Distribution Center",
        "OUT_FOR_DELIVERY", "Out for Delivery — On the Way",
        "DELIVERED", "Delivered Successfully"
    );

    private static final Map<String, String> DESCRIPTIONS = Map.of(
        "PENDING", "Your order has been placed and is being processed.",
        "APPROVED", "Your order has been confirmed and is being prepared for dispatch.",
        "PACKED", "Your order has been packed and is ready for shipment.",
        "SHIPPED", "Your order has been dispatched from the warehouse.",
        "IN_TRANSIT", "Your package is in transit to your region.",
        "NEARBY", "Your package has arrived at a facility near you.",
        "OUT_FOR_DELIVERY", "Your package is on a delivery vehicle heading to you.",
        "DELIVERED", "Your order has been delivered. Thank you!"
    );

    public OrderTrackingService(OrderTrackingRepository trackingRepo, OrderRepository orderRepo) {
        this.trackingRepo = trackingRepo;
        this.orderRepo = orderRepo;
    }

    /** Record a new tracking event for an order */
    @Transactional
    public void addTrackingEvent(Order order, String status, String location, String description) {
        OrderTracking tracking = OrderTracking.builder()
                .order(order)
                .status(status)
                .location(location != null ? location : DEFAULT_LOCATIONS.getOrDefault(status, "Processing"))
                .description(description != null ? description : DESCRIPTIONS.getOrDefault(status, "Order is being processed."))
                .build();
        trackingRepo.save(tracking);
    }

    /** Record a tracking event using default location/description */
    @Transactional
    public void addTrackingEvent(Order order, String status) {
        addTrackingEvent(order, status, null, null);
    }

    /** Get full tracking timeline for an order */
    public List<TrackingEvent> getTrackingTimeline(Long orderId) {
        List<OrderTracking> events = trackingRepo.findByOrderIdOrderByCreatedAtAsc(orderId);
        Order order = orderRepo.findById(orderId).orElse(null);

        // Build full timeline showing completed + pending stages
        String[] allStages = {"PENDING", "APPROVED", "PACKED", "SHIPPED", "IN_TRANSIT", "NEARBY", "OUT_FOR_DELIVERY", "DELIVERED"};
        Set<String> completedStatuses = events.stream().map(OrderTracking::getStatus).collect(Collectors.toSet());

        List<TrackingEvent> timeline = new ArrayList<>();
        for (String stage : allStages) {
            Optional<OrderTracking> event = events.stream().filter(e -> e.getStatus().equals(stage)).findFirst();
            boolean isCompleted = completedStatuses.contains(stage);
            boolean isCurrent = order != null && order.getStatus().equals(stage);

            timeline.add(TrackingEvent.builder()
                    .status(stage)
                    .location(event.map(OrderTracking::getLocation).orElse(DEFAULT_LOCATIONS.getOrDefault(stage, "")))
                    .description(event.map(OrderTracking::getDescription).orElse(DESCRIPTIONS.getOrDefault(stage, "")))
                    .timestamp(event.map(OrderTracking::getCreatedAt).orElse(null))
                    .isCompleted(isCompleted)
                    .isCurrent(isCurrent)
                    .build());
        }
        return timeline;
    }

    /** Get tracking summary for an order */
    public TrackingResponse getTrackingSummary(Long orderId) {
        Order order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        List<TrackingEvent> timeline = getTrackingTimeline(orderId);

        // Estimate delivery
        LocalDateTime estimatedDelivery = order.getCreatedAt().plusDays(3);
        if ("DELIVERED".equals(order.getStatus())) {
            estimatedDelivery = order.getUpdatedAt();
        }

        return TrackingResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .currentStatus(order.getStatus())
                .retailerName(order.getRetailer().getUser().getFullName())
                .branchName(order.getBranch().getName())
                .totalAmount(order.getTotalAmount())
                .estimatedDelivery(estimatedDelivery)
                .timeline(timeline)
                .build();
    }

    /** Simulate progression: auto-advance SHIPPED orders through stages */
    @Transactional
    public void simulateTracking(Long orderId) {
        Order order = orderRepo.findById(orderId).orElse(null);
        if (order == null) return;

        String currentStatus = order.getStatus();
        String nextStatus = getNextSimulationStatus(currentStatus);

        if (nextStatus != null) {
            order.setStatus(nextStatus);
            orderRepo.save(order);
            addTrackingEvent(order, nextStatus);
        }
    }

    private String getNextSimulationStatus(String current) {
        switch (current) {
            case "SHIPPED": return "IN_TRANSIT";
            case "IN_TRANSIT": return "NEARBY";
            case "NEARBY": return "OUT_FOR_DELIVERY";
            case "OUT_FOR_DELIVERY": return "DELIVERED";
            default: return null;
        }
    }
}
