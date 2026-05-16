package com.taskmanager.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Converts a decoded {@link Jwt} into a {@link UsernamePasswordAuthenticationToken}
 * whose principal is a {@link UserPrincipal} built entirely from JWT claims —
 * no database lookup, keeping the resource-server path fully stateless.
 *
 * <p>Claims expected in the token (set by {@link JwtService#generateAccessToken}):
 * <ul>
 *   <li>{@code sub}   — user UUID</li>
 *   <li>{@code role}  — system role (e.g. ROLE_USER)</li>
 *   <li>{@code email} — user email</li>
 * </ul>
 */
@Component
public class JwtToPrincipalConverter implements Converter<Jwt, UsernamePasswordAuthenticationToken> {

    @Override
    public UsernamePasswordAuthenticationToken convert(Jwt jwt) {
        UserPrincipal principal = UserPrincipal.builder()
                .id(UUID.fromString(jwt.getSubject()))
                .systemRole(jwt.getClaimAsString("role"))
                .email(jwt.getClaimAsString("email"))
                .password(null)  // not needed for stateless JWT auth
                .build();

        return new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
    }
}
