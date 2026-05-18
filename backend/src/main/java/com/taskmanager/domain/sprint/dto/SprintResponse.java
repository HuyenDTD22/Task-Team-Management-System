package com.taskmanager.domain.sprint.dto;

import com.taskmanager.common.enums.SprintStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class SprintResponse {

    private final UUID id;
    private final UUID projectId;
    private final String name;
    private final String goal;
    private final SprintStatus status;
    private final LocalDate startDate;
    private final LocalDate endDate;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final UUID createdBy;
    private final UUID updatedBy;
}
