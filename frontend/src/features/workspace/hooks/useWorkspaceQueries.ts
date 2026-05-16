import { useQuery } from '@tanstack/react-query'
import { workspaceApi } from '@/api/endpoints/workspace.api'
import { queryKeys } from '@/api/queryKeys'
import type { WorkspaceFilterParams } from '@/types/common.types'

export function useMyWorkspaces(params?: WorkspaceFilterParams) {
  return useQuery({
    queryKey: queryKeys.workspace.lists(params),
    queryFn: async () => {
      const { data } = await workspaceApi.getMyWorkspaces(params)
      return data.data
    },
    placeholderData: (prev) => prev,
    staleTime: 0,
  })
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: queryKeys.workspace.detail(id),
    queryFn: async () => {
      const { data } = await workspaceApi.getById(id)
      return data.data
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 15_000,
  })
}

export function useWorkspaceMembers(id: string) {
  return useQuery({
    queryKey: queryKeys.workspace.members(id),
    queryFn: async () => {
      const { data } = await workspaceApi.getMembers(id)
      return data.data
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: 10_000,
  })
}
