package com.taskmanager.domain.user.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserStatsResponse {
    private long activeTaskCount;
    private long overdueTaskCount;
    private long doneTaskCount;
    private long todoCount;
    private long inProgressCount;
    private long inReviewCount;
}
