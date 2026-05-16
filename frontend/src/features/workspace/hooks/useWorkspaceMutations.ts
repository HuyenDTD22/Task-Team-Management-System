import { useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/api/endpoints/workspace.api'
import { queryKeys } from '@/api/queryKeys'
import type { WorkspaceRole } from '@/types/common.types'
import type { CreateWorkspaceRequest, UpdateWorkspaceRequest } from '@/types/workspace.types'

export function useCreateWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateWorkspaceRequest) =>
      workspaceApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.lists() })
    },
  })
}

export function useUpdateWorkspace(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateWorkspaceRequest) =>
      workspaceApi.update(id, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.workspace.detail(id), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.lists() })
    },
  })
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workspaceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.lists() })
    },
  })
}

export function useAddWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: WorkspaceRole }) =>
      workspaceApi.addMember(workspaceId, { userId, role }).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.members(workspaceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.detail(workspaceId) })
    },
  })
}

export function useUpdateMemberRole(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: WorkspaceRole }) =>
      workspaceApi.updateMemberRole(workspaceId, userId, { role }).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.members(workspaceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.detail(workspaceId) })
    },
  })
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => workspaceApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.members(workspaceId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace.detail(workspaceId) })
    },
  })
}
