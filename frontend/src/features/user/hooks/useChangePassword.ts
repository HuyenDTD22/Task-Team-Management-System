import { useMutation } from '@tanstack/react-query'
import { userApi } from '@/api/endpoints/user.api'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/common.types'

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(data),
    onError: (error: AxiosError<ApiError>) => error,
  })
}
