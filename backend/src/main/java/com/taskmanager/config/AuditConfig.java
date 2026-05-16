package com.taskmanager.config;

import com.taskmanager.security.SecurityUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;
import java.util.UUID;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class AuditConfig {

    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> {
            try {
                if (SecurityUtil.isAuthenticated()) {
                    return Optional.of(SecurityUtil.getCurrentUserId());
                }
            } catch (Exception ignored) {
                // No user in context (system operations, startup, etc.)
            }
            return Optional.empty();
        };
    }
}
