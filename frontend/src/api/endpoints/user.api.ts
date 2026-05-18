import { apiClient } from '@/api/axios'
import type { ApiResponse, UserStatsResponse } from '@/types/common.types'
import type { UserResponse } from '@/types/auth.types'

export const userApi = {
  searchByEmail: (email: string) =>
    apiClient.get<ApiResponse<UserResponse>>('/users/search', { params: { email } }),

  getMe: () =>
    apiClient.get<ApiResponse<UserResponse>>('/users/me'),

  updateProfile: (data: { fullName: string }) =>
    apiClient.patch<ApiResponse<UserResponse>>('/users/me', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.patch<ApiResponse<void>>('/users/me/password', data),

  updateAvatar: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.patch<ApiResponse<UserResponse>>('/users/me/avatar', form)
  },

  getMyStats: () =>
    apiClient.get<ApiResponse<UserStatsResponse>>('/users/me/stats'),
}
