import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/features/user/hooks/useCurrentUser'

function FolderPlusIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function PlusCircleIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

const STATS = [
  { label: 'Total Projects', value: '—', note: 'Phase 2', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Active Tasks',   value: '—', note: 'Phase 3', color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Completed',      value: '—', note: 'Phase 3', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Team Members',   value: '—', note: 'Phase 2', color: 'text-sky-600',     bg: 'bg-sky-50'     },
]

const QUICK_ACTIONS = [
  {
    icon: <FolderPlusIcon />,
    label: 'New Workspace',
    desc: 'Create a workspace for your team',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: <PlusCircleIcon />,
    label: 'New Project',
    desc: 'Start a new project in a workspace',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: <UsersIcon />,
    label: 'Invite Members',
    desc: 'Add teammates to your workspace',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
]

export function DashboardPage() {
  const { user: storeUser } = useAuthStore()
  const { data: freshUser } = useCurrentUser()

  const user = freshUser ?? storeUser
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-500">Here's your workspace at a glance.</p>
        </div>
        <Link
          to="/profile"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          View Profile
        </Link>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
            <p className={`mt-2 text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="mt-1 text-[11px] text-slate-400">Coming in {s.note}</p>
          </div>
        ))}
      </div>

      {/* ── Bottom grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Quick Actions</h2>
          <div className="space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                disabled
                className="flex w-full cursor-not-allowed items-center gap-4 rounded-lg border border-slate-100 p-3.5 text-left opacity-60 transition-opacity"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.bg} ${action.color}`}>
                  {action.icon}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <span className="ml-auto rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-400">
                  Soon
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="text-slate-300">
              <ClockIcon />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-500">No activity yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Your recent tasks and project updates will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
