import type { WorkspaceFilterParams, ProjectFilterParams } from '@/types/common.types'

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
}
