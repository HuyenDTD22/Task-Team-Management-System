import type { ProjectRole } from '@/types/common.types'

export interface TaskPerms {
  canCreateTask: boolean      // DEVELOPER+ or wsAdmin
  canEditTitle: boolean       // MANAGER | wsAdmin only (planning field)
  canEditDescription: boolean // MANAGER | wsAdmin | assignee (content field)
  canChangeStatus: boolean    // MANAGER | wsAdmin | assignee
  canAssignTask: boolean      // MANAGER | wsAdmin
  canDeleteTask: boolean      // MANAGER | wsAdmin
  canAddComment: boolean      // DEVELOPER+ or wsAdmin (not VIEWER)
}

/**
 * Computes field-level task permissions from the current user's project role.
 * role === null means the user is a workspace ADMIN/OWNER with no explicit project role → full access.
 */
export function getTaskPermissions(
  role: ProjectRole | null,
  assigneeId?: string | null,
  currentUserId?: string,
): TaskPerms {
  const isManager   = role === null || role === 'MANAGER'
  const isDeveloper = isManager || role === 'DEVELOPER'
  const isAssignee  = !!assigneeId && !!currentUserId && assigneeId === currentUserId

  return {
    canCreateTask:      isDeveloper,
    canEditTitle:       isManager,
    canEditDescription: isManager || isAssignee,
    canChangeStatus:    isManager || isAssignee,
    canAssignTask:      isManager,
    canDeleteTask:      isManager,
    canAddComment:      isDeveloper,
  }
}
