package com.taskmanager.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public final class SecurityUtil {

    private SecurityUtil() {}

    public static UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }

    public static UserPrincipal getCurrentUser() {
        Authentication auth = getAuthentication();
        if (!(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new IllegalStateException("Security principal is not a UserPrincipal");
        }
        return principal;
    }

    public static boolean isAuthenticated() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null
                && auth.isAuthenticated()
                && auth.getPrincipal() instanceof UserPrincipal;
    }

    private static Authentication getAuthentication() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user in security context");
        }
        return auth;
    }
}
