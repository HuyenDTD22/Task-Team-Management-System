import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/api/endpoints/notification.api'
import { queryKeys } from '@/api/queryKeys'

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      notificationApi.markAsRead(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notification.all })
    },
  })
}
