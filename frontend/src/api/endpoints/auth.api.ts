import { apiClient } from '@/api/axios'
import type { ApiResponse } from '@/types/common.types'
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '@/types/auth.types'

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<UserResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data),

  refresh: () =>
    apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh'),

  logout: () =>
    apiClient.post<ApiResponse<void>>('/auth/logout'),
}
