import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskStatusBadge } from './TaskStatusBadge'
import { KanbanCard } from './KanbanCard'
import type { TaskStatus } from '@/types/common.types'
import type { TaskSummaryResponse } from '@/types/task.types'

interface Props {
  status: TaskStatus
  tasks: TaskSummaryResponse[]
  currentUserId: string
  isManager: boolean
  onCardClick: (id: string) => void
}

const COLUMN_COLORS: Record<TaskStatus, string> = {
  TODO:        'border-slate-200 bg-slate-50',
  IN_PROGRESS: 'border-blue-200 bg-blue-50/40',
  IN_REVIEW:   'border-amber-200 bg-amber-50/40',
  DONE:        'border-green-200 bg-green-50/40',
}

const COLUMN_HEADER_COLORS: Record<TaskStatus, string> = {
  TODO:        'border-slate-200 bg-slate-100',
  IN_PROGRESS: 'border-blue-200 bg-blue-100/60',
  IN_REVIEW:   'border-amber-200 bg-amber-100/60',
  DONE:        'border-green-200 bg-green-100/60',
}

export function KanbanColumn({ status, tasks, currentUserId, isManager, onCardClick }: Readonly<Props>) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={[
        'flex flex-col rounded-xl border transition-colors',
        isOver ? 'border-indigo-400 ring-2 ring-indigo-300/50' : COLUMN_COLORS[status],
      ].join(' ')}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between rounded-t-xl border-b px-3 py-2.5 ${COLUMN_HEADER_COLORS[status]}`}>
        <TaskStatusBadge status={status} />
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {tasks.length}
        </span>
      </div>

      {/* Card list */}
      <div
        ref={setNodeRef}
        className="flex min-h-[200px] flex-1 flex-col gap-2 overflow-y-auto p-2"
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <KanbanCard
              key={t.id}
              task={t}
              canDrag={isManager || t.assigneeId === currentUserId}
              onClick={onCardClick}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center py-8 text-xs text-slate-400">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}
