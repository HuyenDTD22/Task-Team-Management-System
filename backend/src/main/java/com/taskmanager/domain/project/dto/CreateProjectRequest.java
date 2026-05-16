package com.taskmanager.domain.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class CreateProjectRequest {

    @NotBlank(message = "Project name is required")
    @Size(min = 2, max = 100, message = "Project name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Project key is required")
    @Size(min = 1, max = 10, message = "Project key must be between 1 and 10 characters")
    @Pattern(regexp = "^[A-Z0-9]+$", message = "Project key must contain only uppercase letters and digits (e.g. PROJ, APP1)")
    private String key;

    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;
}
