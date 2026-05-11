package com.wholesale.system.exception;

/**
 * Exception thrown for invalid or bad request data.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
