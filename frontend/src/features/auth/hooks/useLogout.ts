import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/stores/authStore'

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      // Always clear local state regardless of server response
      clearAuth()
      queryClient.clear()
      navigate('/login')
    },
  })
}
