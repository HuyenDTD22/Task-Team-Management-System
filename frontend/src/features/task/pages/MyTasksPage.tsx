import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/stores/authStore'
import { useProject } from '@/features/project/hooks/useProjectQueries'
import { useMyTasks } from '@/features/task/hooks/useTaskQueries'
import { TaskStatusBadge } from '@/features/task/components/TaskStatusBadge'
import { TaskPriorityBadge } from '@/features/task/components/TaskPriorityBadge'
import { TaskFilters } from '@/features/task/components/TaskFilters'
import { TaskDetailPanel } from '@/features/task/components/TaskDetailPanel'
import type { TaskFilterParams, TaskStatus, TaskPriority } from '@/types/common.types'

export function MyTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useAuthStore((s) => s.user)

  const taskId        = searchParams.get('taskId')
  const taskProjectId = searchParams.get('taskProjectId')

  const { data: openProject } = useProject(taskProjectId ?? '', !!taskProjectId)

  const page      = Number(searchParams.get('page') ?? '0')
  const size      = Number(searchParams.get('size') ?? '10')
  const sortBy    = searchParams.get('sortBy') ?? 'createdAt'
  const sortDir   = (searchParams.get('sortDir') ?? 'desc') as 'asc' | 'desc'
  const statusParam   = searchParams.get('status') as TaskStatus | null
  const priorityParam = searchParams.get('priority') as TaskPriority | null

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
    page,
    size,
    sortBy,
    sortDir,
    status: statusParam ?? undefined,
    priority: priorityParam ?? undefined,
    search: searchParams.get('search') ?? undefined,
  }

  const { data, isLoading } = useMyTasks(params)

  const tasks = data?.content ?? []
  const totalElements = data?.totalElements ?? 0
  const totalPages = data?.totalPages ?? 0

  function handleFilterChange(p: TaskFilterParams) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p.page ?? 0))
      next.set('size', String(p.size ?? size))
      if (p.status) next.set('status', p.status)
      else next.delete('status')
      if (p.priority) next.set('priority', p.priority)
      else next.delete('priority')
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

  function openPanel(tId: string, pId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('taskId', tId)
      next.set('taskProjectId', pId)
      return next
    })
  }

  function closePanel() {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.delete('taskId')
      next.delete('taskProjectId')
      return next
    })
  }

  return (
    <>
      <TaskDetailPanel
        taskId={taskId}
        projectId={taskProjectId ?? ''}
        onClose={closePanel}
        currentUserId={currentUser?.id ?? ''}
        currentUserRole={openProject?.currentUserRole ?? null}
        isWorkspaceAdmin={
          openProject?.currentWorkspaceRole === 'OWNER' ||
          openProject?.currentWorkspaceRole === 'ADMIN'
        }
      />
    <div className="min-h-full bg-slate-50 px-8 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">All tasks assigned to you across every project.</p>
        </div>

        {/* Filters */}
        <div className="mb-4">
          <TaskFilters
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            params={params}
            onChange={handleFilterChange}
            showSprintFilter={false}
          />
        </div>

        {/* Loading */}
        {isLoading && tasks.length === 0 && (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && tasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <p className="font-medium text-slate-700">No tasks assigned to you</p>
            <p className="mt-1 text-sm text-slate-500">
              Tasks assigned to you across all projects will appear here.
            </p>
          </div>
        )}

        {/* Table */}
        {tasks.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Key</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Priority</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Project</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Assignee</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((t) => {
                  const isOverdue =
                    t.dueDate != null &&
                    new Date(t.dueDate) < new Date() &&
                    t.status !== 'DONE'
                  return (
                    <tr
                      key={t.id}
                      onClick={() => openPanel(t.id, t.projectId)}
                      className="cursor-pointer hover:bg-slate-50"
                    >
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
                        <TaskPriorityBadge priority={t.priority} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="truncate text-slate-600">{t.projectName}</span>
                      </td>
                      <td className="px-4 py-3">
                        {t.assigneeName ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={t.assigneeName} imageUrl={t.assigneeAvatarUrl ?? undefined} size="sm" />
                            <span className="truncate text-slate-700">{t.assigneeName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {t.dueDate ? (
                          <span className={isOverdue ? 'font-semibold text-red-500' : 'text-slate-500'}>
                            {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
      </div>
    </div>
    </>
  )
}
