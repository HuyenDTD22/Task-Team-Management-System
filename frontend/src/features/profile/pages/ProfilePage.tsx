import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/features/user/hooks/useCurrentUser'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ProfilePage() {
  const { user: storeUser } = useAuthStore()
  const { data: freshUser, isLoading } = useCurrentUser()

  const user = freshUser ?? storeUser

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="mt-1 text-sm text-slate-500">Your personal account information</p>
        </div>
        <Link
          to="/profile/edit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Edit Profile
        </Link>
      </div>

      {isLoading && !storeUser ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Avatar + name card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-6">
              <Avatar name={user?.fullName ?? ''} imageUrl={user?.avatarUrl} size="xl" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user?.fullName}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{user?.email}</p>
                <span className="mt-3 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {user?.systemRole === 'ROLE_ADMIN' ? 'Administrator' : 'Member'}
                </span>
              </div>
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-sm font-semibold text-slate-700">Account Details</h3>
            </div>
            <div className="divide-y divide-slate-100">
              <Row label="Full name" value={user?.fullName ?? '—'} />
              <Row label="Email address" value={user?.email ?? '—'} />
              <Row label="System role" value={user?.systemRole === 'ROLE_ADMIN' ? 'Administrator' : 'Standard user'} />
              <Row label="Member since" value={formatDate(user?.createdAt)} />
              <Row label="Status">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-emerald-700">Active</span>
                </span>
              </Row>
            </div>
          </div>

          {/* Settings shortcut */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Security Settings</p>
                <p className="mt-0.5 text-xs text-slate-400">Manage your password and account security</p>
              </div>
              <Link
                to="/settings"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Go to Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-slate-500">{label}</span>
      {children ?? <span className="text-sm font-medium text-slate-800">{value}</span>}
    </div>
  )
}
