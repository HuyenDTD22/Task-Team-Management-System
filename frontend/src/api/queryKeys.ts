import type { WorkspaceFilterParams, ProjectFilterParams, TaskFilterParams, SprintFilterParams, NotificationFilterParams } from '@/types/common.types'

export const queryKeys = {
  currentUser: ['users', 'me'] as const,

  workspace: {
    all: ['workspaces'] as const,
    lists: (params?: WorkspaceFilterParams) =>
      [...queryKeys.workspace.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.workspace.all, id] as const,
    members: (id: string) => [...queryKeys.workspace.all, id, 'members'] as const,
  },

  project: {
    all: ['projects'] as const,
    byWorkspace: (workspaceId: string, params?: ProjectFilterParams) =>
      [...queryKeys.project.all, 'workspace', workspaceId, params ?? {}] as const,
    detail: (id: string) => [...queryKeys.project.all, id] as const,
    members: (id: string) => [...queryKeys.project.all, id, 'members'] as const,
  },

  task: {
    all: ['tasks'] as const,
    byProject: (projectId: string, params?: TaskFilterParams) =>
      [...queryKeys.task.all, 'project', projectId, params ?? {}] as const,
    mine: (params?: TaskFilterParams) =>
      [...queryKeys.task.all, 'mine', params ?? {}] as const,
    detail: (id: string) => [...queryKeys.task.all, id] as const,
    comments: (taskId: string) => [...queryKeys.task.all, taskId, 'comments'] as const,
  },

  sprint: {
    all: ['sprints'] as const,
    byProject: (projectId: string, params?: SprintFilterParams) =>
      [...queryKeys.sprint.all, 'project', projectId, params ?? {}] as const,
    detail: (id: string) => [...queryKeys.sprint.all, id] as const,
  },

  notification: {
    all: ['notifications'] as const,
    lists: (params?: NotificationFilterParams) =>
      [...queryKeys.notification.all, 'list', params ?? {}] as const,
    unreadCount: () => [...queryKeys.notification.all, 'unread-count'] as const,
  },

  userStats: () => ['users', 'me', 'stats'] as const,
}
