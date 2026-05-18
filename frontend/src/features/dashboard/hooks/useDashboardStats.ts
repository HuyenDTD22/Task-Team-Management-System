import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints/user.api'
import { queryKeys } from '@/api/queryKeys'

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: async () => {
      const { data } = await userApi.getMyStats()
      return data.data
    },
    staleTime: 0,
    refetchInterval: 60_000,
  })
}
