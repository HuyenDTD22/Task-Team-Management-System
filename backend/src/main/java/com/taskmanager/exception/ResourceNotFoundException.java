package com.taskmanager.exception;

import java.util.UUID;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(ErrorCode errorCode) {
        super(errorCode);
    }

    public ResourceNotFoundException(String resourceName, UUID id) {
        super(ErrorCode.RESOURCE_NOT_FOUND, resourceName + " not found with id: " + id);
    }

    public ResourceNotFoundException(String resourceName, String field, Object value) {
        super(ErrorCode.RESOURCE_NOT_FOUND, resourceName + " not found with " + field + ": " + value);
    }
}
