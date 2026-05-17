package com.taskmanager.domain.comment.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CreateCommentRequest {

    @NotBlank(message = "Comment content is required")
    private String content;

    private UUID parentId;
}
