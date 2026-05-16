import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints/auth.api'
import type { RegisterRequest } from '@/types/auth.types'
import type { ApiError } from '@/types/common.types'
import type { AxiosError } from 'axios'

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      navigate('/login')
    },
    onError: (error: AxiosError<ApiError>) => {
      return error
    },
  })
}
