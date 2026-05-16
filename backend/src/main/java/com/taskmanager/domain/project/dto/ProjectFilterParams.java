package com.taskmanager.domain.project.dto;

import com.taskmanager.common.enums.ProjectStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProjectFilterParams {

    private String search;

    /** null = return all statuses; ACTIVE | ARCHIVED = filter by status. */
    private ProjectStatus status;

    /** Zero-based page index. */
    @Min(0)
    private int page = 0;

    /** Allowed values: 5, 10, 15, 20. */
    @Min(5) @Max(20)
    private int size = 10;

    /** Sort field: name | createdAt | updatedAt. Defaults to createdAt. */
    private String sortBy = "createdAt";

    /** Sort direction: asc | desc. Defaults to desc. */
    private String sortDir = "desc";
}
