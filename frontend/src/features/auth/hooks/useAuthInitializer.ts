import { useEffect } from 'react'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/stores/authStore'

/**
 * Called once on app mount. Attempts to restore session via the HttpOnly
 * refresh_token cookie. If the cookie is still valid, a new access token is
 * issued and the user is marked as authenticated without needing to log in again.
 */
export function useAuthInitializer() {
  const { setAuth, setInitializing } = useAuthStore()

  useEffect(() => {
    authApi
      .refresh()
      .then(({ data }) => {
        setAuth(data.data.user, data.data.accessToken)
      })
      .catch(() => {
        // No valid session — user must log in
      })
      .finally(() => {
        setInitializing(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
