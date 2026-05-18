import { useQuery } from '@tanstack/react-query'
import { sprintApi } from '@/api/endpoints/sprint.api'
import { queryKeys } from '@/api/queryKeys'
import type { SprintFilterParams } from '@/types/common.types'

export function useProjectSprints(projectId: string, params?: SprintFilterParams) {
  return useQuery({
    queryKey: queryKeys.sprint.byProject(projectId, params),
    queryFn: async () => {
      const { data } = await sprintApi.getByProject(projectId, params)
      return data.data
    },
    enabled: !!projectId,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useSprint(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.sprint.detail(id),
    queryFn: async () => {
      const { data } = await sprintApi.getById(id)
      return data.data
    },
    enabled: enabled && !!id,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}
