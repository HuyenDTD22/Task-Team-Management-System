package com.taskmanager.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // --- Auth ---
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED,    "AUTH_001", "Invalid email or password"),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED,           "AUTH_002", "Token has expired"),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED,           "AUTH_003", "Token is invalid"),
    REFRESH_TOKEN_NOT_FOUND(HttpStatus.UNAUTHORIZED, "AUTH_004", "Refresh token not found"),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED,   "AUTH_005", "Refresh token has expired"),
    REFRESH_TOKEN_REVOKED(HttpStatus.UNAUTHORIZED,   "AUTH_006", "Refresh token has been revoked"),

    // --- User ---
    USER_NOT_FOUND(HttpStatus.NOT_FOUND,       "USR_001", "User not found"),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT,  "USR_002", "Email is already in use"),
    WRONG_PASSWORD(HttpStatus.BAD_REQUEST,     "USR_003", "Current password is incorrect"),

    // --- Workspace ---
    WORKSPACE_NOT_FOUND(HttpStatus.NOT_FOUND,                   "WS_001", "Workspace not found"),
    WORKSPACE_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND,            "WS_002", "Workspace member not found"),
    WORKSPACE_MEMBER_ALREADY_EXISTS(HttpStatus.CONFLICT,        "WS_003", "User is already a workspace member"),
    CANNOT_REMOVE_OWNER(HttpStatus.BAD_REQUEST,                 "WS_004", "Cannot remove workspace owner. Transfer ownership first"),

    // --- Project ---
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND,                  "PROJ_001", "Project not found"),
    PROJECT_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND,           "PROJ_002", "Project member not found"),
    PROJECT_MEMBER_ALREADY_EXISTS(HttpStatus.CONFLICT,       "PROJ_003", "User is already a project member"),
    USER_NOT_WORKSPACE_MEMBER(HttpStatus.BAD_REQUEST,        "PROJ_004", "User must be a workspace member before joining a project"),
    PROJECT_KEY_ALREADY_EXISTS(HttpStatus.CONFLICT,          "PROJ_005", "Project key is already in use in this workspace"),

    // --- Sprint ---
    SPRINT_NOT_FOUND(HttpStatus.NOT_FOUND,       "SPR_001", "Sprint not found"),
    SPRINT_ALREADY_ACTIVE(HttpStatus.CONFLICT,   "SPR_002", "Project already has an active sprint"),
    SPRINT_NOT_ACTIVE(HttpStatus.BAD_REQUEST,    "SPR_003", "Sprint is not in ACTIVE status"),
    SPRINT_NOT_PLANNED(HttpStatus.BAD_REQUEST,   "SPR_004", "Sprint must be in PLANNED status to start"),

    // --- Task ---
    TASK_NOT_FOUND(HttpStatus.NOT_FOUND,                  "TASK_001", "Task not found"),
    TASK_NOT_IN_PROJECT(HttpStatus.BAD_REQUEST,           "TASK_002", "Task does not belong to this project"),
    INVALID_STATUS_TRANSITION(HttpStatus.BAD_REQUEST,     "TASK_003", "Invalid task status transition"),

    // --- Comment ---
    COMMENT_NOT_FOUND(HttpStatus.NOT_FOUND,            "CMT_001", "Comment not found"),
    INVALID_COMMENT_PARENT(HttpStatus.BAD_REQUEST,     "CMT_002", "Cannot reply to a reply. Only one level of nesting is allowed"),

    // --- File Upload ---
    UPLOAD_FILE_EMPTY(HttpStatus.BAD_REQUEST,           "FILE_001", "Uploaded file must not be empty"),
    UPLOAD_FILE_TYPE_INVALID(HttpStatus.BAD_REQUEST,    "FILE_002", "Only image files are allowed (JPEG, JPG, PNG, WebP, GIF)"),
    UPLOAD_FILE_TOO_LARGE(HttpStatus.BAD_REQUEST,       "FILE_003", "File size exceeds the maximum allowed limit"),
    UPLOAD_FAILED(HttpStatus.BAD_GATEWAY,               "FILE_004", "File upload failed. Please try again later"),

    // --- Common ---
    ACCESS_DENIED(HttpStatus.FORBIDDEN,                 "CMN_001", "You do not have permission to perform this action"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND,            "CMN_002", "Resource not found"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST,            "CMN_003", "Validation failed"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "CMN_999", "An unexpected error occurred");

    private final HttpStatus httpStatus;
    private final String code;
    private final String defaultMessage;

    ErrorCode(HttpStatus httpStatus, String code, String defaultMessage) {
        this.httpStatus = httpStatus;
        this.code = code;
        this.defaultMessage = defaultMessage;
    }
}
