package com.taskmanager.common.enums;

public enum WorkspaceRole {
    OWNER,
    ADMIN,
    MEMBER;

    public boolean isAtLeast(WorkspaceRole required) {
        return this.ordinal() <= required.ordinal();
    }
}
