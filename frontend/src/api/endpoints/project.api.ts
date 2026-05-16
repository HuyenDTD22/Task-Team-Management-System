import { apiClient } from '@/api/axios'
import type { ApiResponse, PageResponse, ProjectFilterParams } from '@/types/common.types'
import type {
  ProjectResponse,
  ProjectSummaryResponse,
  ProjectMemberResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  AddProjectMemberRequest,
} from '@/types/project.types'

export const projectApi = {
  create: (workspaceId: string, data: CreateProjectRequest) =>
    apiClient.post<ApiResponse<ProjectResponse>>(
      `/workspaces/${workspaceId}/projects`,
      data,
    ),

  getByWorkspace: (workspaceId: string, params?: ProjectFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<ProjectSummaryResponse>>>(
      `/workspaces/${workspaceId}/projects`,
      { params },
    ),

  getById: (id: string) =>
    apiClient.get<ApiResponse<ProjectResponse>>(`/projects/${id}`),

  update: (id: string, data: UpdateProjectRequest) =>
    apiClient.put<ApiResponse<ProjectResponse>>(`/projects/${id}`, data),

  archive: (id: string) =>
    apiClient.post<ApiResponse<ProjectResponse>>(`/projects/${id}/archive`),

  getMembers: (id: string) =>
    apiClient.get<ApiResponse<ProjectMemberResponse[]>>(`/projects/${id}/members`),

  addMember: (id: string, data: AddProjectMemberRequest) =>
    apiClient.post<ApiResponse<ProjectMemberResponse>>(`/projects/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    apiClient.delete<ApiResponse<void>>(`/projects/${id}/members/${userId}`),
}
