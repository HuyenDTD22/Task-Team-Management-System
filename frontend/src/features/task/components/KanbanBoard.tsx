import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { Spinner } from '@/components/ui/Spinner'
import { useProjectTasks } from '@/features/task/hooks/useTaskQueries'
import { useChangeAnyTaskStatus } from '@/features/task/hooks/useTaskMutations'
import { useProjectSprints } from '@/features/sprint/hooks/useSprintQueries'
import { TaskDetailPanel } from './TaskDetailPanel'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import type { ProjectRole, TaskStatus } from '@/types/common.types'
import type { TaskSummaryResponse } from '@/types/task.types'

const COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

interface Props {
  projectId: string
  currentUserRole: ProjectRole | null
  isWorkspaceAdmin?: boolean
  currentUserId: string
}

export function KanbanBoard({ projectId, currentUserRole, isWorkspaceAdmin, currentUserId }: Readonly<Props>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTask, setActiveTask] = useState<TaskSummaryResponse | null>(null)

  const sprintId = searchParams.get('sprintId') ?? undefined
  const backlog  = searchParams.get('backlog') === 'true'
  const taskId   = searchParams.get('taskId')

  const boardParams = {
    sprintId,
    backlog: backlog || undefined,
    size: 100,
    page: 0,
    sortBy: 'createdAt',
    sortDir: 'asc' as const,
  }

  const { data, isLoading } = useProjectTasks(projectId, boardParams)
  const { data: sprintPage } = useProjectSprints(projectId, { size: 20 })
  const { mutate: changeStatus } = useChangeAnyTaskStatus(projectId)

  const tasks = data?.content ?? []
  const availableSprints = (sprintPage?.content ?? []).filter((s) => s.status !== 'COMPLETED')

  const isManager = currentUserRole === 'MANAGER' || !!isWorkspaceAdmin

  // Group tasks by status
  const columnTasks = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((s) => [s, [] as TaskSummaryResponse[]])) as Record<TaskStatus, TaskSummaryResponse[]>
    for (const t of tasks) {
      if (map[t.status]) map[t.status].push(t)
    }
    return map
  }, [tasks])

  // DnD sensors — 5px activation distance prevents accidental drags on card click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over || !activeTask) return

    // Resolve target column: over.id is either a column status string or another card's UUID
    const targetStatus: TaskStatus | undefined =
      COLUMNS.find((s) => s === over.id) ??
      tasks.find((t) => t.id === over.id)?.status

    if (!targetStatus || targetStatus === activeTask.status) return

    const canDrag = isManager || activeTask.assigneeId === currentUserId
    if (!canDrag) return

    changeStatus({ taskId: String(active.id), status: targetStatus })
  }

  function openPanel(id: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('taskId', id)
      return next
    })
  }

  function closePanel() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('taskId')
      return next
    })
  }

  function handleSprintChange(val: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (val === '__backlog__') {
          next.set('backlog', 'true')
          next.delete('sprintId')
        } else if (val === '') {
          next.delete('sprintId')
          next.delete('backlog')
        } else {
          next.set('sprintId', val)
          next.delete('backlog')
        }
        return next
      },
      { replace: true },
    )
  }

  const sprintSelectValue = backlog ? '__backlog__' : (sprintId ?? '')

  const tooManyTasks = (data?.totalElements ?? 0) > 100

  return (
    <>
      <TaskDetailPanel
        taskId={taskId}
        projectId={projectId}
        onClose={closePanel}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        isWorkspaceAdmin={isWorkspaceAdmin}
      />

      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-3">
        <select
          value={sprintSelectValue}
          onChange={(e) => handleSprintChange(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">All tasks</option>
          <option value="__backlog__">Backlog</option>
          {availableSprints.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {tooManyTasks && (
          <span className="text-xs text-amber-600">
            Showing first 100 of {data?.totalElements} tasks. Use sprint filter for a focused view.
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {/* Board */}
      {!isLoading && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-4 gap-3">
            {COLUMNS.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={columnTasks[status]}
                currentUserId={currentUserId}
                isManager={isManager}
                onCardClick={openPanel}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <KanbanCard
                task={activeTask}
                canDrag={false}
                onClick={() => {}}
              />
            )}
          </DragOverlay>
        </DndContext>
      )}
    </>
  )
}
