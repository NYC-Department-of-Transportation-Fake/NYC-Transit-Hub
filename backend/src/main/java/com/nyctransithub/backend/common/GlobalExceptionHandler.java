package com.nyctransithub.backend.common;

import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers,
            HttpStatusCode statusCode, WebRequest request) {
        if (((ServletWebRequest) request).getResponse().isCommitted()) {
            return null;
        }
        HttpStatus status = HttpStatus.resolve(statusCode.value());
        String code = status == null ? "HTTP_" + statusCode.value() : status.name();
        String message = status == null ? "Request failed" : status.getReasonPhrase();
        return new ResponseEntity<>(error(code, message, request), headers, statusCode);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFound(ResourceNotFoundException ex, WebRequest request) {
        return new ResponseEntity<>(error(ex.code(), ex.getMessage(), request), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleUnexpectedException(Exception ex, WebRequest request) {
        log.error("Unhandled request failure", ex);
        return new ResponseEntity<>(
                error("INTERNAL_ERROR", "An unexpected error occurred", request),
                HttpStatus.INTERNAL_SERVER_ERROR);
    }

    private ApiErrorResponse error(String code, String message, WebRequest request) {
        String path = ((ServletWebRequest) request).getRequest().getRequestURI();
        return new ApiErrorResponse(code, message, Instant.now(), path);
    }

    @ExceptionHandler(TransitDataUnavailableException.class)
    public ResponseEntity<Object> handleTransitUnavailable(TransitDataUnavailableException ex, WebRequest request) {
        log.warn("Realtime transit data unavailable", ex);
        return new ResponseEntity<>(error("TRANSIT_DATA_UNAVAILABLE",
                "Realtime arrival data is currently unavailable", request), HttpStatus.SERVICE_UNAVAILABLE);
    }
}
