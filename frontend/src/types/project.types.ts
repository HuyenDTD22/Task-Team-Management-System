import type { ProjectRole, WorkspaceRole } from '@/types/common.types'

export interface ProjectResponse {
  id: string
  workspaceId: string
  workspaceName: string
  name: string
  key: string
  description: string | null
  status: 'ACTIVE' | 'ARCHIVED'
  currentUserRole: ProjectRole | null
  currentWorkspaceRole: WorkspaceRole | null
  memberCount: number
  createdAt: string
}

export interface ProjectSummaryResponse {
  id: string
  name: string
  key: string
  status: 'ACTIVE' | 'ARCHIVED'
  currentUserRole: ProjectRole | null
  memberCount: number
}

export interface ProjectMemberResponse {
  userId: string
  fullName: string
  email: string
  avatarUrl: string | null
  role: ProjectRole
  joinedAt: string
}

export interface CreateProjectRequest {
  name: string
  key: string
  description?: string
}

export interface UpdateProjectRequest {
  name: string
  description?: string
}

export interface AddProjectMemberRequest {
  userId: string
  role: ProjectRole
}
