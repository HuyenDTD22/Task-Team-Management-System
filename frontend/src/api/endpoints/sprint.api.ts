import { apiClient } from '@/api/axios'
import type { ApiResponse, PageResponse, SprintFilterParams } from '@/types/common.types'
import type {
  SprintResponse,
  SprintSummaryResponse,
  CreateSprintRequest,
  UpdateSprintRequest,
} from '@/types/sprint.types'

export const sprintApi = {
  create: (projectId: string, data: CreateSprintRequest) =>
    apiClient.post<ApiResponse<SprintResponse>>(`/projects/${projectId}/sprints`, data),

  getByProject: (projectId: string, params?: SprintFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<SprintSummaryResponse>>>(
      `/projects/${projectId}/sprints`,
      { params },
    ),

  getById: (id: string) =>
    apiClient.get<ApiResponse<SprintResponse>>(`/sprints/${id}`),

  update: (id: string, data: UpdateSprintRequest) =>
    apiClient.put<ApiResponse<SprintResponse>>(`/sprints/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/sprints/${id}`),

  start: (id: string) =>
    apiClient.post<ApiResponse<SprintResponse>>(`/sprints/${id}/start`),

  complete: (id: string) =>
    apiClient.post<ApiResponse<SprintResponse>>(`/sprints/${id}/complete`),

  addTask: (sprintId: string, taskId: string) =>
    apiClient.post<ApiResponse<void>>(`/sprints/${sprintId}/tasks/${taskId}`),

  removeTask: (sprintId: string, taskId: string) =>
    apiClient.delete<ApiResponse<void>>(`/sprints/${sprintId}/tasks/${taskId}`),
}
