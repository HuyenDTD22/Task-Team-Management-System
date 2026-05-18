package com.taskmanager.domain.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationFilterParams {

    /** null = all; true = unread only; false = read only. */
    private Boolean isRead;

    @Min(0)
    private int page = 0;

    @Min(5) @Max(20)
    private int size = 10;
}
