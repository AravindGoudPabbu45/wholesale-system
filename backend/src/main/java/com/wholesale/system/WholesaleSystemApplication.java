package com.wholesale.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main entry point for the Smart Inventory Management System.
 * Multi-Branch B2B Wholesale Automation Platform.
 */
@SpringBootApplication
@EnableCaching
public class WholesaleSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(WholesaleSystemApplication.class, args);
    }
}
