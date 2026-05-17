import { apiClient } from '@/api/axios'
import type { ApiResponse, PageResponse, TaskFilterParams } from '@/types/common.types'
import type {
  TaskResponse,
  TaskSummaryResponse,
  CommentResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  AssignTaskRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types/task.types'

export const taskApi = {
  // ── Tasks ────────────────────────────────────────────────────────────────────

  create: (projectId: string, data: CreateTaskRequest) =>
    apiClient.post<ApiResponse<TaskResponse>>(`/projects/${projectId}/tasks`, data),

  getByProject: (projectId: string, params?: TaskFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<TaskSummaryResponse>>>(
      `/projects/${projectId}/tasks`,
      { params },
    ),

  getById: (id: string) =>
    apiClient.get<ApiResponse<TaskResponse>>(`/tasks/${id}`),

  update: (id: string, data: UpdateTaskRequest) =>
    apiClient.put<ApiResponse<TaskResponse>>(`/tasks/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/tasks/${id}`),

  changeStatus: (id: string, data: UpdateTaskStatusRequest) =>
    apiClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/status`, data),

  assign: (id: string, data: AssignTaskRequest) =>
    apiClient.patch<ApiResponse<TaskResponse>>(`/tasks/${id}/assignee`, data),

  // ── Comments ─────────────────────────────────────────────────────────────────

  addComment: (taskId: string, data: CreateCommentRequest) =>
    apiClient.post<ApiResponse<CommentResponse>>(`/tasks/${taskId}/comments`, data),

  getComments: (taskId: string, params?: { page?: number; size?: number; sortDir?: string }) =>
    apiClient.get<ApiResponse<PageResponse<CommentResponse>>>(
      `/tasks/${taskId}/comments`,
      { params },
    ),

  updateComment: (id: string, data: UpdateCommentRequest) =>
    apiClient.put<ApiResponse<CommentResponse>>(`/comments/${id}`, data),

  deleteComment: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/comments/${id}`),
}
