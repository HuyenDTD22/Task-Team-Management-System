package com.taskmanager.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex) {
        log.warn("Business exception [{}]: {}", ex.getErrorCode().getCode(), ex.getMessage());
        return ResponseEntity
                .status(ex.getErrorCode().getHttpStatus())
                .body(ErrorResponse.builder()
                        .success(false)
                        .code(ex.getErrorCode().getCode())
                        .message(ex.getMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorResponse.FieldError> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> ErrorResponse.FieldError.builder()
                        .field(fe.getField())
                        .message(fe.getDefaultMessage())
                        .build())
                .toList();

        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.builder()
                        .success(false)
                        .code(ErrorCode.VALIDATION_ERROR.getCode())
                        .message("Validation failed")
                        .errors(fieldErrors)
                        .build());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity
                .status(401)
                .body(ErrorResponse.builder()
                        .success(false)
                        .code(ErrorCode.INVALID_CREDENTIALS.getCode())
                        .message(ErrorCode.INVALID_CREDENTIALS.getDefaultMessage())
                        .build());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.builder()
                        .success(false)
                        .code(ErrorCode.VALIDATION_ERROR.getCode())
                        .message("Invalid value for parameter '" + ex.getName() + "'")
                        .build());
    }

    // Spring's built-in limit hit before reaching CloudinaryService validation
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity
                .badRequest()
                .body(ErrorResponse.builder()
                        .success(false)
                        .code(ErrorCode.UPLOAD_FILE_TOO_LARGE.getCode())
                        .message(ErrorCode.UPLOAD_FILE_TOO_LARGE.getDefaultMessage())
                        .build());
    }

    // Catch-all — log fully, never expose internal details to client
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity
                .status(500)
                .body(ErrorResponse.builder()
                        .success(false)
                        .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                        .message(ErrorCode.INTERNAL_SERVER_ERROR.getDefaultMessage())
                        .build());
    }
}
