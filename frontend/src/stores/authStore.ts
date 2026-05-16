import { create } from 'zustand'
import { setAccessToken, clearAccessToken } from '@/api/axios'
import type { UserResponse } from '@/types/auth.types'

interface AuthState {
  user: UserResponse | null
  isAuthenticated: boolean
  isInitializing: boolean

  setAuth: (user: UserResponse, token: string) => void
  clearAuth: () => void
  setInitializing: (value: boolean) => void
  updateUser: (user: UserResponse) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  setAuth: (user, token) => {
    setAccessToken(token)
    set({ user, isAuthenticated: true })
  },

  clearAuth: () => {
    clearAccessToken()
    set({ user: null, isAuthenticated: false })
  },

  setInitializing: (value) => set({ isInitializing: value }),

  updateUser: (user) => set({ user }),
}))
