package com.taskmanager.domain.auth.dto;

import com.taskmanager.domain.user.dto.UserResponse;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AuthResponse {

    private final String accessToken;

    @Builder.Default
    private final String tokenType = "Bearer";

    // Expiry in seconds (for client-side countdown)
    private final long expiresIn;

    private final UserResponse user;
}
