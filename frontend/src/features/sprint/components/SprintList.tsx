import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AlertDialog } from '@/components/ui/AlertDialog'
import { useProjectSprints } from '@/features/sprint/hooks/useSprintQueries'
import {
  useDeleteSprint,
  useStartSprint,
  useCompleteSprint,
  useUpdateSprint,
} from '@/features/sprint/hooks/useSprintMutations'
import { useProjectTasks } from '@/features/task/hooks/useTaskQueries'
import { TaskStatusBadge } from '@/features/task/components/TaskStatusBadge'
import { BacklogSection } from '@/features/task/components/BacklogSection'
import { SprintStatusBadge } from './SprintStatusBadge'
import { CreateSprintModal } from './CreateSprintModal'
import type { SprintStatus } from '@/types/common.types'
import type { SprintSummaryResponse } from '@/types/sprint.types'

type AxiosLike = { response?: { data?: { message?: string } } }

interface Props {
  projectId: string
  canManage: boolean
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function SprintTaskPreview({ projectId, sprintId }: Readonly<{ projectId: string; sprintId: string }>) {
  const { data, isLoading } = useProjectTasks(projectId, {
    sprintId,
    size: 5,
    page: 0,
    sortBy: 'dueDate',
    sortDir: 'desc',
  })
  const tasks = data?.content ?? []
  const total = data?.totalElements ?? 0
  const extra = total - tasks.length

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm text-slate-400">
        <Spinner size="sm" /> Loading tasks…
      </div>
    )
  }

  if (total === 0) {
    return <p className="py-1 text-sm text-slate-400">No tasks in this sprint yet.</p>
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {total} {total === 1 ? 'task' : 'tasks'}
      </p>
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{t.taskKey}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{t.title}</span>
          <span className="flex-shrink-0 text-xs text-slate-400">
            {t.dueDate
              ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'No due date'}
          </span>
          <TaskStatusBadge status={t.status} />
        </div>
      ))}
      {extra > 0 && (
        <p className="text-xs text-slate-400">+{extra} more task{extra > 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

interface EditState {
  id: string
  name: string
  goal: string
  startDate: string
  endDate: string
}

function SprintCard({
  sprint,
  canManage,
  projectId,
}: {
  sprint: SprintSummaryResponse
  canManage: boolean
  projectId: string
}) {
  const [, setSearchParams] = useSearchParams()
  const [expanded, setExpanded] = useState(false)
  const [confirmStart, setConfirmStart] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState<EditState | null>(null)
  const [dateError, setDateError] = useState('')
  const [actionError, setActionError] = useState<{ title: string; message: string } | null>(null)

  const { mutate: startSprint, isPending: isStarting } = useStartSprint(sprint.id, projectId)
  const { mutate: completeSprint, isPending: isCompleting } = useCompleteSprint(sprint.id, projectId)
  const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint(projectId)
  const { mutate: updateSprint, isPending: isUpdating, error: updateError } = useUpdateSprint(sprint.id, projectId)
  const updateApiError = updateError as { response?: { data?: { message?: string } } } | null

  function openEdit() {
    setEditing({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal ?? '',
      startDate: sprint.startDate ?? '',
      endDate: sprint.endDate ?? '',
    })
    setDateError('')
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    setDateError('')
    if (editing.startDate && editing.endDate && editing.endDate < editing.startDate) {
      setDateError('End date cannot be before start date.')
      return
    }
    updateSprint(
      {
        name: editing.name.trim(),
        goal: editing.goal.trim() || null,
        startDate: editing.startDate || null,
        endDate: editing.endDate || null,
      },
      { onSuccess: () => setEditing(null) },
    )
  }

  const startDate = formatDate(sprint.startDate)
  const endDate = formatDate(sprint.endDate)

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Confirm dialogs */}
      {actionError && (
        <AlertDialog
          title={actionError.title}
          message={actionError.message}
          onClose={() => setActionError(null)}
        />
      )}
      {confirmStart && (
        <ConfirmDialog
          title="Start sprint"
          message={`Start "${sprint.name}"? Only one sprint can be active at a time.`}
          confirmLabel="Start sprint"
          onConfirm={() =>
            startSprint(undefined, {
              onError: (err) => {
                const msg = (err as AxiosLike)?.response?.data?.message
                setActionError({
                  title: 'Failed to start sprint',
                  message: msg ?? 'Only one active sprint is allowed in a project.',
                })
              },
            })
          }
          onClose={() => setConfirmStart(false)}
        />
      )}
      {confirmComplete && (
        <ConfirmDialog
          title="Complete sprint"
          message={`Complete "${sprint.name}"? Incomplete tasks (To Do, In Progress, In Review) will be moved back to the backlog.`}
          confirmLabel="Complete sprint"
          onConfirm={() =>
            completeSprint(undefined, {
              onError: (err) => {
                const msg = (err as AxiosLike)?.response?.data?.message
                setActionError({
                  title: 'Failed to complete sprint',
                  message: msg ?? 'Failed to complete sprint.',
                })
              },
            })
          }
          onClose={() => setConfirmComplete(false)}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete sprint"
          message={`Delete "${sprint.name}"? All tasks in this sprint will be moved to the backlog. This cannot be undone.`}
          confirmLabel="Delete sprint"
          onConfirm={() => deleteSprint(sprint.id)}
          onClose={() => setConfirmDelete(false)}
        />
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Edit sprint</h2>
            <p className="mb-5 text-sm text-slate-500">Update sprint details.</p>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  maxLength={100}
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Goal</label>
                <textarea
                  value={editing.goal}
                  onChange={(e) => setEditing({ ...editing, goal: e.target.value })}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Start date</label>
                  <input
                    type="date"
                    value={editing.startDate}
                    onChange={(e) => { setEditing({ ...editing, startDate: e.target.value }); setDateError('') }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">End date</label>
                  <input
                    type="date"
                    value={editing.endDate}
                    onChange={(e) => { setEditing({ ...editing, endDate: e.target.value }); setDateError('') }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              {dateError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{dateError}</p>
              )}
              {updateApiError && !dateError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {updateApiError.response?.data?.message ?? 'Something went wrong.'}
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editing.name.trim()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUpdating && <Spinner size="sm" />}
                  {isUpdating ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card header */}
      <button
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <svg
          className={`mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-900">{sprint.name}</span>
            <SprintStatusBadge status={sprint.status} />
          </div>
          {(startDate || endDate) && (
            <p className="mt-0.5 text-xs text-slate-500">
              {startDate ?? '—'} → {endDate ?? '—'}
            </p>
          )}
          {!expanded && sprint.goal && (
            <p className="mt-1 line-clamp-1 text-sm text-slate-500">{sprint.goal}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {sprint.status === 'ACTIVE' && (
            <button
              onClick={() =>
                setSearchParams(
                  { tab: 'board', sprintId: sprint.id },
                  { replace: true },
                )
              }
              className="rounded-lg border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50"
            >
              View Board
            </button>
          )}
          {canManage && (
            <>
              {sprint.status === 'PLANNED' && (
                <>
                  <button
                    onClick={() => setConfirmStart(true)}
                    disabled={isStarting}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {isStarting && <Spinner size="sm" />}
                    Start
                  </button>
                  <button
                    onClick={openEdit}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    disabled={isDeleting}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
              {sprint.status === 'ACTIVE' && (
                <button
                  onClick={() => setConfirmComplete(true)}
                  disabled={isCompleting}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCompleting && <Spinner size="sm" />}
                  Complete
                </button>
              )}
            </>
          )}
        </div>
      </button>

      {/* Expanded section: goal + task preview */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          {sprint.goal && (
            <p className="text-sm text-slate-600">{sprint.goal}</p>
          )}
          <SprintTaskPreview projectId={projectId} sprintId={sprint.id} />
        </div>
      )}
    </div>
  )
}

export function SprintList({ projectId, canManage }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)

  const page = Number(searchParams.get('sPage') ?? '0')
  const size = Number(searchParams.get('sSize') ?? '10')
  const sprintStatusParam = searchParams.get('sprintStatus') as SprintStatus | null

  const { data, isLoading } = useProjectSprints(projectId, {
    status: sprintStatusParam ?? undefined,
    page,
    size,
  })

  const sprints = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  function setPage(p: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sPage', String(p))
      return next
    })
  }

  function setSize(s: number) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('sSize', String(s))
      next.set('sPage', '0')
      return next
    })
  }

  function setStatusFilter(status: SprintStatus | '') {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (status) next.set('sprintStatus', status)
      else next.delete('sprintStatus')
      next.set('sPage', '0')
      return next
    })
  }

  return (
    <div>
      {showCreate && (
        <CreateSprintModal projectId={projectId} onClose={() => setShowCreate(false)} />
      )}

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={sprintStatusParam ?? ''}
            onChange={(e) => setStatusFilter(e.target.value as SprintStatus | '')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All statuses</option>
            <option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create sprint
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && sprints.length === 0 && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && sprints.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium text-slate-700">No sprints found</p>
          <p className="mt-1 text-sm text-slate-500">
            {sprintStatusParam
              ? 'Try a different status filter.'
              : canManage
                ? 'Create your first sprint to start planning.'
                : 'No sprints have been created yet.'}
          </p>
        </div>
      )}

      {/* Sprint cards */}
      {sprints.length > 0 && (
        <div className="space-y-3">
          {sprints.map((sprint) => (
            <SprintCard
              key={sprint.id}
              sprint={sprint}
              canManage={canManage}
              projectId={projectId}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={size}
        onPageChange={setPage}
        onPageSizeChange={setSize}
      />

      <BacklogSection projectId={projectId} canManage={canManage} sprints={sprints} />
    </div>
  )
}
