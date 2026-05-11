package com.wholesale.system.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT utility class for token generation, validation, and extraction.
 */
@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    /** Generate a secret key from the configured secret string */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /** Generate JWT token with user id, username, and role */
    public String generateToken(Long userId, String username, String role) {
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /** Extract username from token */
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    /** Extract user ID from token */
    public Long extractUserId(String token) {
        return getClaims(token).get("userId", Long.class);
    }

    /** Extract role from token */
    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    /** Validate the token */
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** Parse and return all claims from the token */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
