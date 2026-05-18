import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Avatar } from '@/components/ui/Avatar'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import type { TaskSummaryResponse } from '@/types/task.types'

interface Props {
  task: TaskSummaryResponse
  canDrag: boolean
  onClick: (id: string) => void
}

export function KanbanCard({ task, canDrag, onClick }: Readonly<Props>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, disabled: !canDrag })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isOverdue =
    task.dueDate != null && new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(canDrag ? listeners : {})}
      onClick={() => onClick(task.id)}
      className={[
        'group rounded-lg border bg-white p-3 shadow-sm transition-shadow',
        'hover:shadow-md',
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging ? 'shadow-lg ring-2 ring-indigo-400' : 'border-slate-200',
      ].join(' ')}
    >
      {/* Key */}
      <span className="mb-1.5 block font-mono text-[10px] font-semibold text-slate-400">
        {task.taskKey}
      </span>

      {/* Title */}
      <p className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-slate-800">
        {task.title}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-2">
        <TaskPriorityBadge priority={task.priority} />

        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-[11px] ${isOverdue ? 'font-semibold text-red-500' : 'text-slate-400'}`}>
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assigneeName ? (
            <Avatar name={task.assigneeName} imageUrl={task.assigneeAvatarUrl} size="sm" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-dashed border-slate-300" />
          )}
        </div>
      </div>
    </div>
  )
}
