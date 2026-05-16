import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints/user.api'
import { useAuthStore } from '@/stores/authStore'
import { currentUserKey } from '@/features/user/hooks/useCurrentUser'
import type { UserResponse } from '@/types/auth.types'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()

  return useMutation({
    mutationFn: (data: { fullName: string }) => userApi.updateProfile(data),
    onSuccess: ({ data }) => {
      updateUser(data.data)
      queryClient.setQueryData<UserResponse>(currentUserKey, data.data)
    },
  })
}
