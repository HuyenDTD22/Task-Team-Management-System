package com.taskmanager.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

@Getter
@Setter
@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {

    private String cloudName;
    private String apiKey;
    private String apiSecret;

    /** Maximum allowed upload size. Supports Spring DataSize notation: 5MB, 1024KB. */
    private DataSize maxFileSize = DataSize.ofMegabytes(5);
}
