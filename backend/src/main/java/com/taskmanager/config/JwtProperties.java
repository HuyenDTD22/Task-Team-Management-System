package com.taskmanager.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

    private String secret;
    private long accessTokenExpiry = 1_800_000L;    // 30 min (ms)
    private long refreshTokenExpiry = 604_800_000L; // 7 days (ms)
}
