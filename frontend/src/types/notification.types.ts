export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'COMMENT_ADDED'
  | 'SPRINT_STARTED'
  | 'SPRINT_COMPLETED'
  | 'PROJECT_MEMBER_ADDED'
  | 'WORKSPACE_MEMBER_ADDED'

export type NotificationEntityType = 'TASK' | 'PROJECT' | 'WORKSPACE'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string | null
  entityType: NotificationEntityType | null
  entityId: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}
