package com.taskmanager.config;

import com.cloudinary.Cloudinary;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class CloudinaryConfig {

    private final CloudinaryProperties properties;

    @Bean
    Cloudinary cloudinary() {
        return new Cloudinary(Map.of(
                "cloud_name", properties.getCloudName(),
                "api_key",    properties.getApiKey(),
                "api_secret", properties.getApiSecret(),
                "secure",     true   // always use HTTPS URLs
        ));
    }
}
