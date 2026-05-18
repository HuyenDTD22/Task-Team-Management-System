import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/stores/authStore'
import { useProjectTasks } from '@/features/task/hooks/useTaskQueries'
import { useDeleteTask } from '@/features/task/hooks/useTaskMutations'
import { getTaskPermissions } from '@/features/task/utils/taskPermissions'
import { useProjectSprints } from '@/features/sprint/hooks/useSprintQueries'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { TaskFilters } from './TaskFilters'
import { CreateTaskModal } from './CreateTaskModal'
import { TaskDetailPanel } from './TaskDetailPanel'
import type { ProjectRole, TaskFilterParams, TaskStatus, TaskPriority } from '@/types/common.types'

interface Props {
  projectId: string
  currentUserRole: ProjectRole | null
  isWorkspaceAdmin?: boolean
}

export function TaskList({ projectId, currentUserRole, isWorkspaceAdmin }: Readonly<Props>) {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useAuthStore((s) => s.user)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null)

  // ── URL param helpers ──────────────────────────────────────────────────────

  const page     = Number(searchParams.get('page') ?? '0')
  const size     = Number(searchParams.get('size') ?? '10')
  const sortBy   = searchParams.get('sortBy') ?? 'createdAt'
  const sortDir  = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc'
  const statusParam   = searchParams.get('status') as TaskStatus | null
  const priorityParam = searchParams.get('priority') as TaskPriority | null
  const taskId   = searchParams.get('taskId')

  // ── Search: single write path via useEffect([debouncedSearch]) ─────────────
  // searchInput state is the controlled value for the input.
  // handleFilterChange never touches search — this eliminates the dual-write conflict.

  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedSearch) next.set('search', debouncedSearch)
        else next.delete('search')
        next.set('page', '0')
        return next
      },
      { replace: true },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const params: TaskFilterParams = {
    search:   searchParams.get('search') ?? undefined,
    status:   statusParam ?? undefined,
    priority: priorityParam ?? undefined,
    page, size, sortBy, sortDir,
  }

  // ── Permissions ────────────────────────────────────────────────────────────
  // Role-level only — no assignee context needed at list level.

  const perms = getTaskPermissions(currentUserRole)

  // ── Query + mutations ──────────────────────────────────────────────────────

  const { data, isLoading } = useProjectTasks(projectId, params)
  const { mutate: deleteTask } = useDeleteTask(projectId)
  const { data: sprintPage } = useProjectSprints(projectId, { size: 20 })
  const sprintNameMap = new Map((sprintPage?.content ?? []).map((s) => [s.id, s.name]))

  const tasks         = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages    = data?.totalPages ?? 0

  // ── Filter change handler (status/priority only — search is separate) ──────
  // Always processes status and priority unconditionally so that selecting "All"
  // (undefined value) correctly deletes the URL param.

  function handleFilterChange(p: TaskFilterParams) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (p.status)   next.set('status', p.status)
      else            next.delete('status')
      if (p.priority) next.set('priority', p.priority)
      else            next.delete('priority')
      next.set('page', '0')
      return next
    })
  }

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  function setSize(s: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('size', String(s))
      next.set('page', '0')
      return next
    })
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {showCreate && (
        <CreateTaskModal projectId={projectId} onClose={() => setShowCreate(false)} />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete task"
          message={`Delete "${confirmDelete.title}"? This cannot be undone.`}
          confirmLabel="Delete task"
          onConfirm={() => deleteTask(confirmDelete.id)}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      <TaskDetailPanel
        taskId={taskId}
        projectId={projectId}
        onClose={closePanel}
        currentUserId={currentUser?.id ?? ''}
        currentUserRole={currentUserRole}
        isWorkspaceAdmin={isWorkspaceAdmin}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TaskFilters
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          params={params}
          onChange={handleFilterChange}
        />
        {perms.canCreateTask && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create task
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && tasks.length === 0 && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && tasks.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">No tasks found</p>
          <p className="mt-1 text-sm text-slate-500">
            {params.search || params.status || params.priority
              ? 'Try adjusting your filters.'
              : 'Create your first task to get started.'}
          </p>
        </div>
      )}

      {/* Table */}
      {tasks.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Key</th>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Title</th>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Priority</th>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Assignee</th>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Due</th>
                <th className="px-4 py-3.5 text-left font-medium text-slate-600">Sprint</th>
                {perms.canDeleteTask && (
                  <th className="px-4 py-3.5 text-right font-medium text-slate-600">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => openPanel(t.id)}
                >
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs font-semibold text-slate-500">{t.taskKey}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="line-clamp-2 font-medium text-slate-900">{t.title}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <TaskPriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3.5">
                    {t.assigneeName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={t.assigneeName} imageUrl={t.assigneeAvatarUrl} size="sm" />
                        <span className="truncate text-slate-700">{t.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {t.dueDate
                      ? new Date(t.dueDate).toLocaleDateString()
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {t.sprintId
                      ? <span className="text-slate-700">{sprintNameMap.get(t.sprintId) ?? '—'}</span>
                      : <span className="text-slate-400">Backlog</span>}
                  </td>
                  {perms.canDeleteTask && (
                    <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setConfirmDelete({ id: t.id, title: t.title })}
                        className="text-xs font-medium text-red-500 transition hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={size}
        onPageChange={setPage}
        onPageSizeChange={setSize}
      />
    </div>
  )
}
