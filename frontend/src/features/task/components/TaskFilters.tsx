import type { TaskFilterParams, TaskStatus, TaskPriority } from '@/types/common.types'

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']
const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
}

const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
}

interface Props {
  // Search is controlled separately — parent owns the input state and debounce
  searchValue: string
  onSearchChange: (v: string) => void
  // Status/priority filters
  params: TaskFilterParams
  onChange: (p: TaskFilterParams) => void
}

export function TaskFilters({ searchValue, onSearchChange, params, onChange }: Readonly<Props>) {
  function update(patch: Partial<TaskFilterParams>) {
    onChange({ ...params, ...patch, page: 0 })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search — controlled directly by parent, bypasses filter onChange */}
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search tasks…"
        className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />

      {/* Status — pass raw value so empty string triggers URL param deletion in parent */}
      <select
        value={params.status ?? ''}
        onChange={(e) => update({ status: e.target.value as TaskStatus | undefined || undefined })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      {/* Priority — same pattern */}
      <select
        value={params.priority ?? ''}
        onChange={(e) => update({ priority: e.target.value as TaskPriority | undefined || undefined })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="">All priorities</option>
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
        ))}
      </select>
    </div>
  )
}
