import { useMutation, useQueryClient } from '@tanstack/react-query'
import { projectApi } from '@/api/endpoints/project.api'
import { queryKeys } from '@/api/queryKeys'
import type { ProjectRole } from '@/types/common.types'
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types/project.types'

export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateProjectRequest) =>
      projectApi.create(workspaceId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project.byWorkspace(workspaceId) })
    },
  })
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateProjectRequest) =>
      projectApi.update(projectId, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.project.detail(projectId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.project.byWorkspace(updated.workspaceId) })
    },
  })
}

export function useArchiveProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => projectApi.archive(id).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.project.detail(updated.id), updated)
      queryClient.invalidateQueries({
        queryKey: queryKeys.project.byWorkspace(updated.workspaceId),
      })
    },
  })
}

export function useAddProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) =>
      projectApi.addMember(projectId, { userId, role }).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project.members(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) })
    },
  })
}

export function useRemoveProjectMember(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => projectApi.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.project.members(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.project.detail(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}
