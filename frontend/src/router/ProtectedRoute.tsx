import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/ui/Spinner'

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuthStore()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
