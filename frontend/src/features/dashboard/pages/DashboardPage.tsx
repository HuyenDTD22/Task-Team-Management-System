import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/features/user/hooks/useCurrentUser'
import { useDashboardStats } from '../hooks/useDashboardStats'
import { useMyTasks } from '@/features/task/hooks/useTaskQueries'
import { TaskStatusBadge } from '@/features/task/components/TaskStatusBadge'
import { TaskStatusChart } from '../components/TaskStatusChart'
import { Spinner } from '@/components/ui/Spinner'

// ── Icons ─────────────────────────────────────────────────────────────────────

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

function ClipboardListIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | undefined
  isLoading: boolean
  colorClass: string
  bgClass: string
}

function StatCard({ label, value, isLoading, colorClass, bgClass }: Readonly<StatCardProps>) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {isLoading ? (
        <div className="mt-2 h-9 flex items-center">
          <Spinner />
        </div>
      ) : (
        <p className={`mt-2 text-3xl font-bold ${colorClass}`}>{value ?? 0}</p>
      )}
      <div className={`mt-2 h-1 w-8 rounded-full ${bgClass}`} />
    </div>
  )
}

// ── Quick action ──────────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  desc: string
  color: string
  bg: string
  onClick: () => void
}

function QuickAction({ icon, label, desc, color, bg, onClick }: Readonly<QuickActionProps>) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-lg border border-slate-100 p-3.5 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${color}`}>
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <svg className="ml-auto h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()
  const { user: storeUser } = useAuthStore()
  const { data: freshUser } = useCurrentUser()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: upcomingData, isLoading: upcomingLoading } = useMyTasks({
    sortBy: 'dueDate',
    sortDir: 'asc',
    size: 5,
  })

  const user = freshUser ?? storeUser
  const firstName = user?.fullName?.split(' ')[0] ?? 'there'

  function renderUpcomingTasks() {
    if (upcomingLoading) {
      return <div className="flex justify-center py-8"><Spinner /></div>
    }
    if (!upcomingData || upcomingData.content.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="text-slate-300"><CalendarIcon /></div>
          <p className="mt-3 text-sm font-medium text-slate-500">No upcoming tasks</p>
          <p className="mt-1 text-xs text-slate-400">Tasks assigned to you will appear here.</p>
        </div>
      )
    }
    return (
      <ul className="divide-y divide-slate-100">
        {upcomingData.content.map((task) => (
          <li key={task.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">{task.title}</p>
              <p className="text-xs text-slate-400">{task.projectName}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <TaskStatusBadge status={task.status} />
              {task.dueDate && (
                <span className="text-[11px] text-slate-400">
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-10">
      {/* Header */}
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

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Tasks"
          value={stats?.activeTaskCount}
          isLoading={statsLoading}
          colorClass="text-violet-600"
          bgClass="bg-violet-400"
        />
        <StatCard
          label="Overdue Tasks"
          value={stats?.overdueTaskCount}
          isLoading={statsLoading}
          colorClass="text-red-500"
          bgClass="bg-red-400"
        />
        <StatCard
          label="Completed Tasks"
          value={stats?.doneTaskCount}
          isLoading={statsLoading}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-400"
        />
      </div>

      {/* Task distribution chart */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Task Distribution</h2>
        <TaskStatusChart stats={stats} isLoading={statsLoading} />
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction
              icon={<FolderPlusIcon />}
              label="New Workspace"
              desc="Create a workspace for your team"
              color="text-indigo-600"
              bg="bg-indigo-50"
              onClick={() => navigate('/workspaces')}
            />
            <QuickAction
              icon={<PlusCircleIcon />}
              label="New Project"
              desc="Start a new project in a workspace"
              color="text-violet-600"
              bg="bg-violet-50"
              onClick={() => navigate('/workspaces')}
            />
            <QuickAction
              icon={<ClipboardListIcon />}
              label="My Tasks"
              desc="View all tasks assigned to you"
              color="text-sky-600"
              bg="bg-sky-50"
              onClick={() => navigate('/tasks')}
            />
          </div>
        </div>

        {/* Upcoming tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Upcoming Tasks</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-indigo-600 hover:underline"
            >
              View all
            </button>
          </div>

          {renderUpcomingTasks()}
        </div>
      </div>
    </div>
  )
}
