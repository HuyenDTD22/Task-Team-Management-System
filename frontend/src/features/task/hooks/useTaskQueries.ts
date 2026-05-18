import { useQuery } from '@tanstack/react-query'
import { taskApi } from '@/api/endpoints/task.api'
import { queryKeys } from '@/api/queryKeys'
import type { TaskFilterParams } from '@/types/common.types'

export function useProjectTasks(projectId: string, params?: TaskFilterParams) {
  return useQuery({
    queryKey: queryKeys.task.byProject(projectId, params),
    queryFn: async () => {
      const { data } = await taskApi.getByProject(projectId, params)
      return data.data
    },
    enabled: !!projectId,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useTask(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.task.detail(id),
    queryFn: async () => {
      const { data } = await taskApi.getById(id)
      return data.data
    },
    enabled: enabled && !!id,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useMyTasks(params?: TaskFilterParams) {
  return useQuery({
    queryKey: queryKeys.task.mine(params),
    queryFn: async () => {
      const { data } = await taskApi.getMyTasks(params)
      return data.data
    },
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useTaskComments(
  taskId: string,
  params?: { page?: number; size?: number; sortDir?: string },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.task.comments(taskId),
    queryFn: async () => {
      const { data } = await taskApi.getComments(taskId, params)
      return data.data
    },
    enabled: enabled && !!taskId,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}
