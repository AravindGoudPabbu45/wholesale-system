package com.wholesale.system.service;

import org.springframework.stereotype.Service;

/**
 * Service to handle sending emails to users.
 * Currently simulates sending by logging to the console to prevent SMTP connection errors
 * without legitimate mail server properties. 
 * Can easily be swapped to use JavaMailSender once SMTP properties are in application.properties.
 */
@Service
public class EmailService {

    public void sendBranchAdminCredentials(String toEmail, String fullName, String username, String password) {
        System.out.println("\n==========================================");
        System.out.println("📧 SIMULATED EMAIL SENT");
        System.out.println("TO: " + toEmail);
        System.out.println("SUBJECT: Your Branch Admin Credentials for Wholesale ERP");
        System.out.println("BODY:");
        System.out.println("Hello " + fullName + ",");
        System.out.println("A Branch Admin account has been created for you.");
        System.out.println("Please log in using the following credentials:");
        System.out.println("Username: " + username);
        System.out.println("Password: " + password);
        System.out.println("\nPlease change your password upon first login.");
        System.out.println("==========================================\n");
    }
}
