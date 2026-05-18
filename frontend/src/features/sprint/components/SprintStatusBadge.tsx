import type { SprintStatus } from '@/types/common.types'

const STATUS_STYLES: Record<SprintStatus, string> = {
  PLANNED:   'bg-slate-100 text-slate-600',
  ACTIVE:    'bg-green-100 text-green-700',
  COMPLETED: 'bg-indigo-100 text-indigo-600',
}

const STATUS_LABELS: Record<SprintStatus, string> = {
  PLANNED:   'Planned',
  ACTIVE:    'Active',
  COMPLETED: 'Completed',
}

interface Props {
  status: SprintStatus
}

export function SprintStatusBadge({ status }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
