import type { TaskFilterParams, TaskStatus, TaskPriority } from '@/types/common.types'
import type { SprintSummaryResponse } from '@/types/sprint.types'

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
  searchValue: string
  onSearchChange: (v: string) => void
  params: TaskFilterParams
  onChange: (p: TaskFilterParams) => void
  sprints?: SprintSummaryResponse[]
  showSprintFilter?: boolean
}

export function TaskFilters({
  searchValue,
  onSearchChange,
  params,
  onChange,
  sprints,
  showSprintFilter = false,
}: Readonly<Props>) {
  function update(patch: Partial<TaskFilterParams>) {
    onChange({ ...params, ...patch, page: 0 })
  }

  function handleSprintChange(val: string) {
    if (val === '__backlog__') {
      update({ sprintId: undefined, backlog: true })
    } else if (val === '') {
      update({ sprintId: undefined, backlog: false })
    } else {
      update({ sprintId: val, backlog: false })
    }
  }

  const sprintSelectValue = params.backlog
    ? '__backlog__'
    : (params.sprintId ?? '')

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <input
        type="text"
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search tasks…"
        className="w-52 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />

      {/* Status */}
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

      {/* Priority */}
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

      {/* Sprint filter — only shown when showSprintFilter is true */}
      {showSprintFilter && (
        <select
          value={sprintSelectValue}
          onChange={(e) => handleSprintChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All sprints</option>
          <option value="__backlog__">Backlog</option>
          {(sprints ?? [])
            .filter((s) => s.status !== 'COMPLETED')
            .map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
        </select>
      )}
    </div>
  )
}
