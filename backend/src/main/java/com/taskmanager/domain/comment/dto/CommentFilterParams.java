package com.taskmanager.domain.comment.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CommentFilterParams {

    @Min(0)
    private int page = 0;

    @Min(5) @Max(50)
    private int size = 20;

    /** Sort direction: asc | desc. Defaults to asc (oldest first). */
    private String sortDir = "asc";
}
