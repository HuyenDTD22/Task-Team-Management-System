package com.taskmanager.domain.auth.service;

import com.taskmanager.config.AppProperties;
import com.taskmanager.config.JwtProperties;
import com.taskmanager.domain.auth.dto.AuthResponse;
import com.taskmanager.domain.auth.dto.LoginRequest;
import com.taskmanager.domain.auth.dto.RegisterRequest;
import com.taskmanager.domain.auth.entity.RefreshToken;
import com.taskmanager.domain.auth.mapper.AuthMapper;
import com.taskmanager.domain.auth.repository.RefreshTokenRepository;
import com.taskmanager.domain.user.dto.UserResponse;
import com.taskmanager.domain.user.entity.User;
import com.taskmanager.domain.user.mapper.UserMapper;
import com.taskmanager.domain.user.repository.UserRepository;
import com.taskmanager.exception.BusinessException;
import com.taskmanager.exception.ConflictException;
import com.taskmanager.exception.ErrorCode;
import com.taskmanager.security.JwtService;
import com.taskmanager.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AppProperties appProperties;
    private final AuthMapper authMapper;
    private final UserMapper userMapper;

    /**
     * Creates a new account. Does NOT issue tokens — the client must call
     * POST /auth/login after successful registration.
     */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = authMapper.toEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        User saved = userRepository.save(user);
        log.info("User registered: {}", saved.getId());

        return userMapper.toResponse(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String deviceInfo, HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()));

        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        User user = userRepository.findById(principal.getId()).orElseThrow();

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getSystemRole(), user.getEmail());
        RefreshToken refreshToken = issueRefreshToken(user, deviceInfo);

        setRefreshTokenCookie(response, refreshToken.getToken());
        log.info("User logged in: {}", user.getId());

        return buildAuthResponse(accessToken, user);
    }

    @Transactional
    public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String tokenValue = extractRefreshCookie(request)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue)
                .orElseThrow(() -> new BusinessException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (refreshToken.isRevoked()) {
            // Reuse of a revoked token signals possible token theft — revoke all sessions
            log.warn("Refresh token reuse detected for user: {}. Revoking all sessions.",
                    refreshToken.getUser().getId());
            refreshTokenRepository.revokeAllByUserId(refreshToken.getUser().getId(), Instant.now());
            clearRefreshTokenCookie(response);
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        if (refreshToken.isExpired()) {
            throw new BusinessException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        // Token rotation: invalidate current, issue new
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getSystemRole(), user.getEmail());
        RefreshToken newRefreshToken = issueRefreshToken(user, refreshToken.getDeviceInfo());

        setRefreshTokenCookie(response, newRefreshToken.getToken());
        return buildAuthResponse(newAccessToken, user);
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        extractRefreshCookie(request).ifPresent(tokenValue ->
                refreshTokenRepository.findByToken(tokenValue).ifPresent(token -> {
                    token.revoke();
                    refreshTokenRepository.save(token);
                })
        );
        clearRefreshTokenCookie(response);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private RefreshToken issueRefreshToken(User user, String deviceInfo) {
        RefreshToken token = new RefreshToken();
        token.setUser(user);
        token.setToken(UUID.randomUUID().toString());
        token.setExpiresAt(Instant.now().plusMillis(jwtProperties.getRefreshTokenExpiry()));
        token.setDeviceInfo(deviceInfo);
        return refreshTokenRepository.save(token);
    }

    private AuthResponse buildAuthResponse(String accessToken, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .expiresIn(jwtProperties.getAccessTokenExpiry() / 1000)
                .user(userMapper.toResponse(user))
                .build();
    }

    private Optional<String> extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return Optional.empty();
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
                .map(jakarta.servlet.http.Cookie::getValue)
                .findFirst();
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, token)
                .httpOnly(true)
                .secure(appProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(Duration.ofMillis(jwtProperties.getRefreshTokenExpiry()))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE, "")
                .httpOnly(true)
                .secure(appProperties.isCookieSecure())
                .sameSite("Strict")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
