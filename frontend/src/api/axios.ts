import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from '@/types/common.types'
import type { AuthResponse } from '@/types/auth.types'

// In-memory token — never persisted to localStorage (XSS protection)
let accessToken: string | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true, // send HttpOnly refresh_token cookie
  // No default Content-Type — Axios sets 'application/json' automatically for plain objects
  // and lets the browser set 'multipart/form-data; boundary=...' for FormData payloads.
  // Setting 'application/json' here would cause Axios's transformRequest to JSON-stringify
  // FormData bodies, sending { file: {} } instead of the actual binary multipart data.
})

// ─── Request interceptor: attach Bearer token ─────────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function drainQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    const is401 = error.response?.status === 401
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh')
    const alreadyRetried = originalRequest._retry

    if (!is401 || isRefreshEndpoint || alreadyRetried) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      // Queue the request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return apiClient(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh')
      const newToken = data.data.accessToken
      setAccessToken(newToken)
      drainQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      clearAccessToken()
      drainQueue(refreshError)
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
