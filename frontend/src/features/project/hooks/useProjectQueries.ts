import { useQuery } from '@tanstack/react-query'
import { projectApi } from '@/api/endpoints/project.api'
import { queryKeys } from '@/api/queryKeys'
import type { ProjectFilterParams } from '@/types/common.types'

export function useWorkspaceProjects(workspaceId: string, params?: ProjectFilterParams) {
  return useQuery({
    queryKey: queryKeys.project.byWorkspace(workspaceId, params),
    queryFn: async () => {
      const { data } = await projectApi.getByWorkspace(workspaceId, params)
      return data.data
    },
    enabled: !!workspaceId,
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: queryKeys.project.detail(id),
    queryFn: async () => {
      const { data } = await projectApi.getById(id)
      return data.data
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useProjectMembers(id: string) {
  return useQuery({
    queryKey: queryKeys.project.members(id),
    queryFn: async () => {
      const { data } = await projectApi.getMembers(id)
      return data.data
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 10_000,
  })
}
