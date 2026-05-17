import type { TaskPriority } from '@/types/common.types'

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  LOW:      'bg-slate-100 text-slate-500',
  MEDIUM:   'bg-blue-100 text-blue-600',
  HIGH:     'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

interface Props {
  priority: TaskPriority
}

export function TaskPriorityBadge({ priority }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  )
}
