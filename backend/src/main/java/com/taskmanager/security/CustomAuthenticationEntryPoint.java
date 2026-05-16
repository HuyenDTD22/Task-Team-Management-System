package com.taskmanager.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanager.exception.ErrorCode;
import com.taskmanager.exception.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns a clean JSON 401 instead of Spring Security's default HTML error page.
 */
@Component
@RequiredArgsConstructor
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse body = ErrorResponse.builder()
                .success(false)
                .code(ErrorCode.TOKEN_INVALID.getCode())
                .message("Authentication required. Provide a valid Bearer token.")
                .build();

        objectMapper.writeValue(response.getWriter(), body);
    }
}
