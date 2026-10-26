package com.nyctransithub.backend.common;

public class TransitDataUnavailableException extends RuntimeException {
    public TransitDataUnavailableException(String message) {
        super(message);
    }

    public TransitDataUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
