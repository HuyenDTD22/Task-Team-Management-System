import type { TaskStatus, TaskPriority } from '@/types/common.types'

export interface UserSummary {
  id: string
  name: string
  avatarUrl: string | null
}

export interface TaskSummaryResponse {
  id: string
  taskKey: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  storyPoints: number | null
  dueDate: string | null
  projectId: string
  assigneeId: string | null
  assigneeName: string | null
  assigneeAvatarUrl: string | null
  reporterId: string
  reporterName: string
  createdAt: string
}

export interface TaskResponse {
  id: string
  taskKey: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  storyPoints: number | null
  dueDate: string | null
  position: number
  projectId: string
  projectKey: string
  sprintId: string | null
  assignee: UserSummary | null
  reporter: UserSummary
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface CommentResponse {
  id: string
  taskId: string
  parentId: string | null
  userId: string
  userName: string
  userAvatarUrl: string | null
  content: string
  edited: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  storyPoints?: number | null
  dueDate?: string | null
}

export interface UpdateTaskRequest {
  title: string
  description?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string | null
  storyPoints?: number | null
  dueDate?: string | null
}

export interface UpdateTaskStatusRequest {
  status: TaskStatus
}

export interface AssignTaskRequest {
  assigneeId: string | null
}

export interface CreateCommentRequest {
  content: string
  parentId?: string | null
}

export interface UpdateCommentRequest {
  content: string
}
