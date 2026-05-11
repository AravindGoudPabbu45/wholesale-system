package com.wholesale.system.controller;

import com.wholesale.system.dto.DTOs.*;
import com.wholesale.system.service.OrderTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * OrderTracking controller — Amazon-style order tracking endpoints.
 */
@RestController
@RequestMapping("/api/tracking")
public class OrderTrackingController {

    private final OrderTrackingService trackingService;

    public OrderTrackingController(OrderTrackingService trackingService) {
        this.trackingService = trackingService;
    }

    /** Get full tracking timeline for an order */
    @GetMapping("/{orderId}")
    public ResponseEntity<TrackingResponse> getTracking(@PathVariable Long orderId) {
        return ResponseEntity.ok(trackingService.getTrackingSummary(orderId));
    }

    /** Get only the timeline events */
    @GetMapping("/{orderId}/timeline")
    public ResponseEntity<List<TrackingEvent>> getTimeline(@PathVariable Long orderId) {
        return ResponseEntity.ok(trackingService.getTrackingTimeline(orderId));
    }

    /** Simulate next tracking stage (for demo purposes) */
    @PostMapping("/{orderId}/simulate")
    public ResponseEntity<TrackingResponse> simulateNext(@PathVariable Long orderId) {
        trackingService.simulateTracking(orderId);
        return ResponseEntity.ok(trackingService.getTrackingSummary(orderId));
    }
}
