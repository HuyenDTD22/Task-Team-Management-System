import { useState, useEffect } from 'react'
import type { AxiosError } from 'axios'
import { Spinner } from '@/components/ui/Spinner'
import { TaskStatusBadge } from './TaskStatusBadge'
import { TaskPriorityBadge } from './TaskPriorityBadge'
import { CommentSection } from './CommentSection'
import { getTaskPermissions } from '@/features/task/utils/taskPermissions'
import { useTask } from '@/features/task/hooks/useTaskQueries'
import {
  useChangeTaskStatus,
  useUpdateTask,
  useAssignTask,
} from '@/features/task/hooks/useTaskMutations'
import { useProjectMembers } from '@/features/project/hooks/useProjectQueries'
import { useProjectSprints, useSprint } from '@/features/sprint/hooks/useSprintQueries'
import { useAddTaskToSprint, useRemoveTaskFromSprint } from '@/features/sprint/hooks/useSprintMutations'
import type { ProjectRole, TaskStatus, TaskPriority } from '@/types/common.types'

interface Props {
  taskId: string | null
  projectId: string
  onClose: () => void
  currentUserId: string
  currentUserRole: ProjectRole | null
  isWorkspaceAdmin?: boolean
}

export function TaskDetailPanel({ taskId, projectId, onClose, currentUserId, currentUserRole, isWorkspaceAdmin }: Readonly<Props>) {
  const { data: task, isLoading, isError, error } = useTask(taskId ?? '', !!taskId)
  const { data: members } = useProjectMembers(projectId)
  const { mutate: changeStatus } = useChangeTaskStatus(taskId ?? '', projectId)
  const { mutate: updateTask, isPending: isSaving } = useUpdateTask(taskId ?? '', projectId)
  const { mutate: assignTask, isPending: isAssigning } = useAssignTask(taskId ?? '', projectId)

  const { data: sprintPage } = useProjectSprints(projectId, { size: 20 })
  const allSprints = sprintPage?.content ?? []
  const currentSprint = allSprints.find((s) => s.id === task?.sprintId)
  const { data: fallbackSprint } = useSprint(
    task?.sprintId ?? '',
    !!task?.sprintId && !currentSprint,
  )
  const displayedSprint = currentSprint ?? fallbackSprint

  const { mutate: addToSprint, isPending: isAddingSprint, error: addSprintError } = useAddTaskToSprint(projectId)
  const { mutate: removeFromSprint, isPending: isRemovingSprint, error: removeSprintError } = useRemoveTaskFromSprint(projectId)
  const isChangingSprint = isAddingSprint || isRemovingSprint
  const sprintChangeError = addSprintError ?? removeSprintError
  type AxiosLike = { response?: { data?: { message?: string } } }
  const sprintErrorMsg = (sprintChangeError as AxiosLike)?.response?.data?.message

  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')

  const is403 = isError && (error as AxiosError)?.response?.status === 403
  useEffect(() => {
    if (!is403) return
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [is403, onClose])

  // Field-level permissions — computed per-task (assignee check requires task data)
  const perms = task
    ? getTaskPermissions(currentUserRole, task.assignee?.id, currentUserId)
    : null

  if (!taskId) return null

  return (
    <>
      {/* Overlay */}
      <button
        type="button"
        className="fixed inset-0 z-40 w-full bg-black/30"
        aria-label="Close panel"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          {task && (
            <span className="font-mono text-sm font-semibold text-slate-500">{task.taskKey}</span>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {is403 && (
            <div className="py-12 text-center">
              <p className="text-slate-600">Access to this task has been revoked.</p>
              <p className="mt-1 text-sm text-slate-400">Closing panel…</p>
            </div>
          )}

          {isError && !is403 && (
            <p className="py-12 text-center text-sm text-slate-500">Failed to load task.</p>
          )}

          {task && perms && (
            <div className="space-y-6">
              {/* Title — editable for MANAGER/wsAdmin only */}
              {editingTitle ? (
                <div className="space-y-2">
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    maxLength={255}
                    autoFocus
                    className="w-full rounded-lg border border-indigo-400 px-3 py-2 text-lg font-semibold text-slate-900 outline-none ring-2 ring-indigo-500/20"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={isSaving || !titleDraft.trim()}
                      onClick={() =>
                        updateTask(
                          {
                            title: titleDraft.trim(),
                            description: task.description,
                            status: task.status,
                            priority: task.priority,
                            assigneeId: task.assignee?.id ?? null,
                            storyPoints: task.storyPoints,
                            dueDate: task.dueDate,
                          },
                          { onSuccess: () => setEditingTitle(false) },
                        )
                      }
                      className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isSaving && <Spinner size="sm" />}
                      Save
                    </button>
                    <button
                      onClick={() => setEditingTitle(false)}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : perms.canEditTitle ? (
                <button
                  type="button"
                  className="w-full cursor-pointer text-left text-xl font-semibold text-slate-900 hover:text-indigo-700"
                  onClick={() => { setTitleDraft(task.title); setEditingTitle(true) }}
                  title="Click to edit title"
                >
                  {task.title}
                </button>
              ) : (
                <p className="text-xl font-semibold text-slate-900">{task.title}</p>
              )}

              {/* Status + Priority row */}
              <div className="flex flex-wrap gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Status</span>
                  <div>
                    <select
                      value={task.status}
                      disabled={!perms.canChangeStatus}
                      onChange={(e) => changeStatus({ status: e.target.value as TaskStatus })}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Priority</span>
                  <div className="pt-0.5">
                    <TaskPriorityBadge priority={task.priority} />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Current</span>
                  <div className="pt-0.5">
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              </div>

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                {/* Assignee — interactive only for MANAGER/wsAdmin */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Assignee</span>
                  <div className="mt-1 flex items-center gap-2">
                    <select
                      value={task.assignee?.id ?? ''}
                      disabled={!perms.canAssignTask || isAssigning}
                      onChange={(e) =>
                        assignTask({ assigneeId: e.target.value || null })
                      }
                      className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {task.assignee && !(members ?? []).some(m => m.userId === task.assignee!.id) && (
                        <option value={task.assignee.id}>{task.assignee.name}</option>
                      )}
                      {(members ?? []).map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                    {isAssigning && <Spinner size="sm" />}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Reporter</span>
                  <p className="mt-0.5 text-slate-700">{task.reporter.name}</p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Due date</span>
                  <p className="mt-0.5 text-slate-700">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : <span className="text-slate-400">—</span>}
                  </p>
                </div>

                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Story points</span>
                  <p className="mt-0.5 text-slate-700">
                    {task.storyPoints ?? <span className="text-slate-400">—</span>}
                  </p>
                </div>

                {/* Sprint — interactive selector for MANAGER/wsAdmin */}
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Sprint</span>
                  <div className="mt-1">
                    {(perms.canAssignTask || !!isWorkspaceAdmin) ? (
                      <select
                        value={task.sprintId ?? ''}
                        disabled={isChangingSprint}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            if (task.sprintId) {
                              removeFromSprint({ sprintId: task.sprintId, taskId: task.id })
                            }
                          } else {
                            addToSprint({ sprintId: val, taskId: task.id })
                          }
                        }}
                        className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">— Backlog</option>
                        {allSprints
                          .filter((s) => s.status !== 'COMPLETED')
                          .map((s) => {
                            const fmt = (d: string | null) =>
                              d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '?'
                            const dates = s.startDate || s.endDate
                              ? ` (${fmt(s.startDate)} – ${fmt(s.endDate)})`
                              : ''
                            return (
                              <option key={s.id} value={s.id}>{s.name}{dates}</option>
                            )
                          })}
                      </select>
                    ) : (
                      <p className="mt-0.5 text-slate-700">
                        {displayedSprint
                          ? displayedSprint.name
                          : <span className="text-slate-400">— Backlog</span>}
                      </p>
                    )}
                    {sprintChangeError && (
                      <p className="mt-1 text-xs text-red-600">
                        {sprintErrorMsg ?? 'Failed to update sprint.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description — editable for MANAGER/wsAdmin or assignee */}
              <div>
                <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-400">
                  Description
                </span>
                {editingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      value={descDraft}
                      onChange={(e) => setDescDraft(e.target.value)}
                      rows={5}
                      autoFocus
                      className="w-full resize-none rounded-lg border border-indigo-400 px-3 py-2 text-sm text-slate-700 outline-none ring-2 ring-indigo-500/20"
                    />
                    <div className="flex gap-2">
                      <button
                        disabled={isSaving}
                        onClick={() =>
                          updateTask(
                            {
                              title: task.title,
                              description: descDraft.trim() || null,
                              status: task.status,
                              priority: task.priority as TaskPriority,
                              assigneeId: task.assignee?.id ?? null,
                              storyPoints: task.storyPoints,
                              dueDate: task.dueDate,
                            },
                            { onSuccess: () => setEditingDesc(false) },
                          )
                        }
                        className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isSaving && <Spinner size="sm" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDesc(false)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : perms.canEditDescription ? (
                  <button
                    type="button"
                    onClick={() => { setDescDraft(task.description ?? ''); setEditingDesc(true) }}
                    className="min-h-[4rem] w-full cursor-pointer rounded-lg border border-transparent p-2 text-left text-sm text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
                    title="Click to edit description"
                  >
                    {task.description
                      ? <p className="whitespace-pre-wrap">{task.description}</p>
                      : <p className="text-slate-400">Click to add description…</p>}
                  </button>
                ) : (
                  <div className="min-h-[4rem] rounded-lg p-2 text-sm text-slate-700">
                    {task.description
                      ? <p className="whitespace-pre-wrap">{task.description}</p>
                      : <p className="text-slate-400">No description.</p>}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200" />

              <CommentSection
                taskId={task.id}
                currentUserId={currentUserId}
                canAddComment={perms.canAddComment}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
