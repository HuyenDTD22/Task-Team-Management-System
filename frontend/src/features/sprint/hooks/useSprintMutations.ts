import { useMutation, useQueryClient } from '@tanstack/react-query'
import { sprintApi } from '@/api/endpoints/sprint.api'
import { queryKeys } from '@/api/queryKeys'
import type { CreateSprintRequest, UpdateSprintRequest } from '@/types/sprint.types'

export function useCreateSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateSprintRequest) =>
      sprintApi.create(projectId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.byProject(projectId) })
    },
  })
}

export function useUpdateSprint(sprintId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateSprintRequest) =>
      sprintApi.update(sprintId, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.sprint.detail(sprintId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.byProject(projectId) })
    },
  })
}

export function useDeleteSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sprintId: string) => sprintApi.delete(sprintId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.byProject(projectId) })
    },
  })
}

export function useStartSprint(sprintId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => sprintApi.start(sprintId).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.sprint.detail(sprintId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.byProject(projectId) })
    },
  })
}

export function useCompleteSprint(sprintId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => sprintApi.complete(sprintId).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.sprint.detail(sprintId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.sprint.byProject(projectId) })
      // Incomplete tasks moved to backlog — all task list caches are stale
      queryClient.invalidateQueries({ queryKey: queryKeys.task.all })
    },
  })
}

export function useAddTaskToSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      sprintApi.addTask(sprintId, taskId),
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
    },
  })
}

export function useRemoveTaskFromSprint(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sprintId, taskId }: { sprintId: string; taskId: string }) =>
      sprintApi.removeTask(sprintId, taskId),
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
    },
  })
}
