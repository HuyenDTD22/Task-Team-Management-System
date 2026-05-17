package com.taskmanager.domain.task.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class UserSummary {
    private final UUID id;
    private final String name;
    private final String avatarUrl;
}
