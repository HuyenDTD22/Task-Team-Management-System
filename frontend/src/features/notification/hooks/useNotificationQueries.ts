import { useQuery } from '@tanstack/react-query'
import { notificationApi } from '@/api/endpoints/notification.api'
import { queryKeys } from '@/api/queryKeys'
import type { NotificationFilterParams } from '@/types/common.types'

export function useNotifications(params?: NotificationFilterParams) {
  return useQuery({
    queryKey: queryKeys.notification.lists(params),
    queryFn: async () => {
      const { data } = await notificationApi.getAll(params)
      return data.data
    },
    placeholderData: (prev) => prev,
    staleTime: 0,
    refetchInterval: 30_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notification.unreadCount(),
    queryFn: async () => {
      const { data } = await notificationApi.getUnreadCount()
      return data.data
    },
    staleTime: 0,
    refetchInterval: 30_000,
  })
}
