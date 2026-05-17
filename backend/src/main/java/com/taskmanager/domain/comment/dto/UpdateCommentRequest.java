package com.taskmanager.domain.comment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateCommentRequest {

    @NotBlank(message = "Comment content is required")
    private String content;
}
