import { apiClient } from '@/api/axios'
import type { ApiResponse, PageResponse, WorkspaceFilterParams } from '@/types/common.types'
import type {
  WorkspaceResponse,
  WorkspaceSummaryResponse,
  WorkspaceMemberResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  AddMemberRequest,
  UpdateMemberRoleRequest,
} from '@/types/workspace.types'

export const workspaceApi = {
  create: (data: CreateWorkspaceRequest) =>
    apiClient.post<ApiResponse<WorkspaceResponse>>('/workspaces', data),

  getMyWorkspaces: (params?: WorkspaceFilterParams) =>
    apiClient.get<ApiResponse<PageResponse<WorkspaceSummaryResponse>>>('/workspaces', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<WorkspaceResponse>>(`/workspaces/${id}`),

  update: (id: string, data: UpdateWorkspaceRequest) =>
    apiClient.put<ApiResponse<WorkspaceResponse>>(`/workspaces/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse<void>>(`/workspaces/${id}`),

  getMembers: (id: string) =>
    apiClient.get<ApiResponse<WorkspaceMemberResponse[]>>(`/workspaces/${id}/members`),

  addMember: (id: string, data: AddMemberRequest) =>
    apiClient.post<ApiResponse<WorkspaceMemberResponse>>(`/workspaces/${id}/members`, data),

  updateMemberRole: (id: string, userId: string, data: UpdateMemberRoleRequest) =>
    apiClient.patch<ApiResponse<WorkspaceMemberResponse>>(
      `/workspaces/${id}/members/${userId}`,
      data,
    ),

  removeMember: (id: string, userId: string) =>
    apiClient.delete<ApiResponse<void>>(`/workspaces/${id}/members/${userId}`),
}
