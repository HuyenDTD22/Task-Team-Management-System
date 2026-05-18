import type { SprintStatus } from '@/types/common.types'

export interface SprintResponse {
  id: string
  projectId: string
  name: string
  goal: string | null
  status: SprintStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

export interface SprintSummaryResponse {
  id: string
  projectId: string
  name: string
  goal: string | null
  status: SprintStatus
  startDate: string | null
  endDate: string | null
  createdAt: string
}

export interface CreateSprintRequest {
  name: string
  goal?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface UpdateSprintRequest {
  name: string
  goal?: string | null
  startDate?: string | null
  endDate?: string | null
}
