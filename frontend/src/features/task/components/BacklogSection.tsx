import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { useProjectTasks } from '@/features/task/hooks/useTaskQueries'
import { useAddTaskToSprint } from '@/features/sprint/hooks/useSprintMutations'
import { TaskStatusBadge } from './TaskStatusBadge'
import type { SprintSummaryResponse } from '@/types/sprint.types'

interface Props {
  projectId: string
  canManage: boolean
  sprints: SprintSummaryResponse[]
}

export function BacklogSection({ projectId, canManage, sprints }: Readonly<Props>) {
  const [page, setPage] = useState(0)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const [selectedSprints, setSelectedSprints] = useState<Record<string, string>>({})

  const { data, isLoading } = useProjectTasks(projectId, {
    backlog: true,
    size: 10,
    page,
    sortBy: 'createdAt',
    sortDir: 'desc',
  })
  const { mutate: addToSprint, isPending } = useAddTaskToSprint(projectId)

  const tasks = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 1
  const availableSprints = sprints.filter((s) => s.status !== 'COMPLETED')

  function handleAddToSprint(taskId: string) {
    const sprintId = selectedSprints[taskId]
    if (!sprintId) return
    addToSprint(
      { sprintId, taskId },
      {
        onSuccess: () => {
          setPendingTaskId(null)
          setSelectedSprints((prev) => {
            const next = { ...prev }
            delete next[taskId]
            return next
          })
        },
      },
    )
  }

  if (totalElements === 0 && !isLoading) return null

  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-base font-semibold text-slate-900">Backlog</h3>
        {data && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
            {totalElements}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      )}

      {!isLoading && tasks.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Key</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Assignee</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Due</th>
                {canManage && (
                  <th className="px-4 py-3 text-right font-medium text-slate-600">Add to Sprint</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] font-semibold text-slate-400">{t.taskKey}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="line-clamp-1 font-medium text-slate-800">{t.title}</span>
                  </td>
                  <td className="px-4 py-3">
                    <TaskStatusBadge status={t.status} />
                  </td>
                  <td className="px-4 py-3">
                    {t.assigneeName ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={t.assigneeName} imageUrl={t.assigneeAvatarUrl} size="sm" />
                        <span className="truncate text-slate-700">{t.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : <span className="text-slate-400">—</span>}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {pendingTaskId === t.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={selectedSprints[t.id] ?? ''}
                            onChange={(e) =>
                              setSelectedSprints((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                            className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="">Select sprint…</option>
                            {availableSprints.map((s) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAddToSprint(t.id)}
                            disabled={!selectedSprints[t.id] || isPending}
                            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {isPending ? <Spinner size="sm" /> : 'Add'}
                          </button>
                          <button
                            onClick={() => setPendingTaskId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setPendingTaskId(t.id)}
                          disabled={availableSprints.length === 0}
                          className="text-xs font-medium text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:text-slate-400"
                          title={availableSprints.length === 0 ? 'No active or planned sprints available' : undefined}
                        >
                          + Add to Sprint
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span>{totalElements} backlog tasks</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-xs">Page {page + 1} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium transition hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
