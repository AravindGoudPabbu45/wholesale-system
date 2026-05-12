package com.wholesale.system.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Simple health/root endpoint for Render's health checks.
 * Render pings "/" to verify the service is running.
 */
@RestController
public class HealthCheckController {

    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of(
            "status", "UP",
            "service", "WholesaleERP API",
            "version", "1.0.0"
        );
    }
}
