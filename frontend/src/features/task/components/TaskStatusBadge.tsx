import type { TaskStatus } from '@/types/common.types'

const STATUS_STYLES: Record<TaskStatus, string> = {
  TODO:        'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  IN_REVIEW:   'bg-amber-100 text-amber-700',
  DONE:        'bg-green-100 text-green-700',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO:        'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW:   'In Review',
  DONE:        'Done',
}

interface Props {
  status: TaskStatus
}

export function TaskStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
