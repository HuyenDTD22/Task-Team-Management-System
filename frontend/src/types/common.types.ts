export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface FieldError {
  field: string
  message: string
}

export interface ApiError {
  success: false
  message: string
  code: string
  errors?: FieldError[]
  timestamp: string
}

export interface PageParams {
  page?: number
  size?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface WorkspaceFilterParams extends PageParams {
  search?: string
}

export interface ProjectFilterParams extends PageParams {
  search?: string
  status?: 'ACTIVE' | 'ARCHIVED'
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED'
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type ProjectRole = 'MANAGER' | 'DEVELOPER' | 'VIEWER'
export type SystemRole = 'ROLE_USER' | 'ROLE_ADMIN'

export interface TaskFilterParams extends PageParams {
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  sprintId?: string
  backlog?: boolean
}

export interface SprintFilterParams extends PageParams {
  status?: SprintStatus
}

export interface NotificationFilterParams extends PageParams {
  isRead?: boolean
}

export interface UserStatsResponse {
  activeTaskCount: number
  overdueTaskCount: number
  doneTaskCount: number
  todoCount: number
  inProgressCount: number
  inReviewCount: number
}
