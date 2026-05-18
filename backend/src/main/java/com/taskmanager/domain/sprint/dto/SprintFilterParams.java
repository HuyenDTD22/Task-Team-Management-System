package com.taskmanager.domain.sprint.dto;

import com.taskmanager.common.enums.SprintStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SprintFilterParams {

    /** null = all statuses; PLANNED | ACTIVE | COMPLETED = filter by status. */
    private SprintStatus status;

    /** Zero-based page index. */
    @Min(0)
    private int page = 0;

    /** Allowed values: 5–20. */
    @Min(5) @Max(20)
    private int size = 10;

    /** Sort field: name | startDate | endDate | createdAt. Defaults to createdAt. */
    private String sortBy = "createdAt";

    /** Sort direction: asc | desc. Defaults to desc. */
    private String sortDir = "desc";
}
