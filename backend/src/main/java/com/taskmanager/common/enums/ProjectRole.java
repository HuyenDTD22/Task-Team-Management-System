package com.taskmanager.common.enums;

public enum ProjectRole {
    MANAGER,
    DEVELOPER,
    VIEWER;

    public boolean isAtLeast(ProjectRole required) {
        return this.ordinal() <= required.ordinal();
    }
}
