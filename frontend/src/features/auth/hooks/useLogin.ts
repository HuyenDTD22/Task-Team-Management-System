import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest } from '@/types/auth.types'
import type { ApiError } from '@/types/common.types'
import type { AxiosError } from 'axios'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken)
      navigate('/dashboard')
    },
    onError: (error: AxiosError<ApiError>) => {
      return error
    },
  })
}
