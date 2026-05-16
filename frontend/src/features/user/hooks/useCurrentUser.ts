import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints/user.api'
import type { UserResponse } from '@/types/auth.types'

export const currentUserKey = ['users', 'me'] as const

export function useCurrentUser() {
  return useQuery<UserResponse>({
    queryKey: currentUserKey,
    queryFn: () => userApi.getMe().then(({ data }) => data.data),
    staleTime: 1000 * 60 * 5,
  })
}
