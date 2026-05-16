export interface UserResponse {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  systemRole: string
  active: boolean
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserResponse
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
}
