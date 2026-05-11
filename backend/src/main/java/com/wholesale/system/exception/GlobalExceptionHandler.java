package com.wholesale.system.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Global exception handler — provides a strict, predictable JSON error format
 * for every single error type in the application.
 *
 * Standard response format:
 * {
 *   "timestamp": "...",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "...",
 *   "path": "/api/branches",
 *   "correlationId": "uuid",
 *   "details": { ... }  // only for validation errors
 * }
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ======== BUSINESS EXCEPTIONS ========

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException ex, WebRequest request) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            BadRequestException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    // ======== VALIDATION ERRORS ========

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            fieldErrors.put(field, message);
        });
        Map<String, Object> body = buildBody(HttpStatus.BAD_REQUEST, "Validation failed", request);
        body.put("details", fieldErrors);
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    // ======== SECURITY EXCEPTIONS ========

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex, WebRequest request) {
        return buildResponse(HttpStatus.FORBIDDEN,
                "Access denied: You don't have permission to perform this action.", request);
    }

    // ======== DATA INTEGRITY ========

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrity(
            DataIntegrityViolationException ex, WebRequest request) {
        String message = "Data integrity violation";
        if (ex.getMostSpecificCause().getMessage().contains("Duplicate")) {
            message = "A record with this value already exists.";
        }
        return buildResponse(HttpStatus.CONFLICT, message, request);
    }

    // ======== REQUEST FORMAT ERRORS ========

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleBadJson(
            HttpMessageNotReadableException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST,
                "Malformed JSON request body.", request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(
            MissingServletRequestParameterException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST,
                "Missing required parameter: " + ex.getParameterName(), request);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        return buildResponse(HttpStatus.BAD_REQUEST,
                "Invalid value for parameter '" + ex.getName() + "': " + ex.getValue(), request);
    }

    // ======== CATCH-ALL ========

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(
            Exception ex, WebRequest request) {
        // Log the full stack trace for debugging
        ex.printStackTrace();
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error: " + ex.getMessage(), request);
    }

    // ======== HELPERS ========

    private ResponseEntity<Map<String, Object>> buildResponse(
            HttpStatus status, String message, WebRequest request) {
        return new ResponseEntity<>(buildBody(status, message, request), status);
    }

    private Map<String, Object> buildBody(HttpStatus status, String message, WebRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("message", message);
        body.put("path", extractPath(request));
        body.put("correlationId", UUID.randomUUID().toString().substring(0, 8));
        return body;
    }

    private String extractPath(WebRequest request) {
        try {
            return request.getDescription(false).replace("uri=", "");
        } catch (Exception e) {
            return "unknown";
        }
    }
}
