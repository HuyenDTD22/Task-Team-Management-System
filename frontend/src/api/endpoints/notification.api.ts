import { apiClient } from '@/api/axios'
import type { ApiResponse, PageResponse, NotificationFilterParams } from '@/types/common.types'
import type { Notification } from '@/types/notification.types'

export const notificationApi = {
  getAll: (params?: NotificationFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<Notification>>>('/notifications', { params }),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<number>>('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<void>>('/notifications/read-all'),
}
