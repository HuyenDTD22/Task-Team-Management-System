import type { WorkspaceRole } from '@/types/common.types'

export interface WorkspaceResponse {
  id: string
  name: string
  slug: string
  description: string | null
  ownerId: string
  currentUserRole: WorkspaceRole
  memberCount: number
  createdAt: string
}

export interface WorkspaceSummaryResponse {
  id: string
  name: string
  slug: string
  currentUserRole: WorkspaceRole
  memberCount: number
}

export interface WorkspaceMemberResponse {
  userId: string
  fullName: string
  email: string
  avatarUrl: string | null
  role: WorkspaceRole
  joinedAt: string
}

export interface CreateWorkspaceRequest {
  name: string
  description?: string
}

export interface UpdateWorkspaceRequest {
  name: string
  description?: string
}

export interface AddMemberRequest {
  userId: string
  role: WorkspaceRole
}

export interface UpdateMemberRoleRequest {
  role: WorkspaceRole
}
