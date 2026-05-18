package com.taskmanager.domain.sprint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateSprintRequest {

    @NotBlank(message = "Sprint name is required")
    @Size(max = 100, message = "Sprint name must not exceed 100 characters")
    private String name;

    /** null = clear goal */
    private String goal;

    /** null = clear start date */
    private LocalDate startDate;

    /** null = clear end date */
    private LocalDate endDate;
}
