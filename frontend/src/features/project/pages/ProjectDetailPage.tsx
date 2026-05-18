import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { useProject, useProjectMembers } from '@/features/project/hooks/useProjectQueries'
import {
  useArchiveProject,
  useUpdateProject,
  useAddProjectMember,
  useRemoveProjectMember,
} from '@/features/project/hooks/useProjectMutations'
import { userApi } from '@/api/endpoints/user.api'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TaskList } from '@/features/task'
import { SprintList } from '@/features/sprint'
import type { ProjectRole } from '@/types/common.types'
import type { UserResponse } from '@/types/auth.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const PROJECT_ROLE_COLOR: Record<ProjectRole, string> = {
  MANAGER: 'bg-purple-100 text-purple-700',
  DEVELOPER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-500',
}

const PROJECT_ROLES: ProjectRole[] = ['MANAGER', 'DEVELOPER', 'VIEWER']

// ── Edit project modal ────────────────────────────────────────────────────────

interface EditProjectModalProps {
  id: string
  initialName: string
  initialDescription: string | null
  onClose: () => void
}

function EditProjectModal({ id, initialName, initialDescription, onClose }: EditProjectModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const { mutate, isPending, error } = useUpdateProject(id)
  const apiError = error as { response?: { data?: { message?: string } } } | null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate(
      { name: name.trim(), description: description.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Edit project</h2>
        <p className="mb-5 text-sm text-slate-500">Update project name and description.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {apiError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {apiError.response?.data?.message ?? 'Something went wrong.'}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending && <Spinner size="sm" />}
              {isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Add project member modal ──────────────────────────────────────────────────

interface AddMemberModalProps {
  projectId: string
  onClose: () => void
}

function AddMemberModal({ projectId, onClose }: AddMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('DEVELOPER')
  const [found, setFound] = useState<UserResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const { mutate, isPending, error } = useAddProjectMember(projectId)
  const apiError = error as { response?: { data?: { message?: string } } } | null

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setFound(null)
    setSearchError(null)
    setSearching(true)
    try {
      const res = await userApi.searchByEmail(email.trim())
      setFound(res.data.data)
    } catch {
      setSearchError('No user found with this email address.')
    } finally {
      setSearching(false)
    }
  }

  function handleAdd() {
    if (!found) return
    mutate({ userId: found.id, role }, { onSuccess: onClose })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Add member</h2>
        <p className="mb-5 text-sm text-slate-500">Search by email to invite someone to this project.</p>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFound(null); setSearchError(null) }}
              placeholder="member@example.com"
              required
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              type="submit"
              disabled={searching || !email.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              {searching ? <Spinner size="sm" /> : 'Search'}
            </button>
          </div>

          {searchError && (
            <p className="text-sm text-red-600">{searchError}</p>
          )}

          {found && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <Avatar name={found.fullName} imageUrl={found.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{found.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{found.email}</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProjectRole)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {PROJECT_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {apiError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {apiError.response?.data?.message ?? 'Failed to add member.'}
            </p>
          )}
        </form>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!found || isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPending && <Spinner size="sm" />}
            {isPending ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'tasks' | 'sprints' | 'members'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: project, isLoading, isError, error } = useProject(id!)
  const { data: members } = useProjectMembers(id!)
  const { mutate: archive, isPending: isArchiving } = useArchiveProject()
  const { mutate: removeMember } = useRemoveProjectMember(id!)

  const [showEdit, setShowEdit] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; name: string } | null>(null)

  const activeTab = (searchParams.get('tab') as Tab) ?? 'tasks'

  function setTab(tab: Tab) {
    setSearchParams({ tab }, { replace: true })
  }

  const is403 = isError && (error as AxiosError)?.response?.status === 403
  useEffect(() => {
    if (!is403) return
    const timer = setTimeout(() => navigate('/workspaces'), 2000)
    return () => clearTimeout(timer)
  }, [is403, navigate])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !project) {
    if (is403) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-slate-600">You no longer have access to this project.</p>
          <p className="text-sm text-slate-400">Redirecting to workspaces…</p>
          <Link to="/workspaces" className="text-sm text-indigo-600 hover:underline">
            Go now
          </Link>
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Project not found or you don't have access.</p>
        <Link to="/workspaces" className="text-sm text-indigo-600 hover:underline">
          Back to workspaces
        </Link>
      </div>
    )
  }

  const isWorkspaceAdmin =
    project.currentWorkspaceRole === 'OWNER' || project.currentWorkspaceRole === 'ADMIN'
  const canManage = project.currentUserRole === 'MANAGER' || isWorkspaceAdmin

  return (
    <div className="min-h-full bg-slate-50">
      {showEdit && (
        <EditProjectModal
          id={id!}
          initialName={project.name}
          initialDescription={project.description}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showAddMember && (
        <AddMemberModal projectId={id!} onClose={() => setShowAddMember(false)} />
      )}
      {confirmArchive && (
        <ConfirmDialog
          title="Archive project"
          message={`Archive "${project.name}"? It will become read-only.`}
          confirmLabel="Archive"
          onConfirm={() => archive(project.id)}
          onClose={() => setConfirmArchive(false)}
        />
      )}
      {confirmRemove && (
        <ConfirmDialog
          title="Remove member"
          message={`Remove ${confirmRemove.name} from this project?`}
          confirmLabel="Remove"
          onConfirm={() => removeMember(confirmRemove.userId)}
          onClose={() => setConfirmRemove(null)}
        />
      )}

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/workspaces" className="shrink-0 hover:text-indigo-600">Workspaces</Link>
            <span className="shrink-0">/</span>
            <Link
              to={`/workspaces/${project.workspaceId}`}
              className="shrink-0 hover:text-indigo-600"
            >
              {project.workspaceName}
            </Link>
            <span className="shrink-0">/</span>
            <span className="min-w-0 truncate text-slate-700">{project.name}</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="shrink-0 rounded-md bg-slate-900 px-2.5 py-1 font-mono text-sm font-semibold text-white">
                  {project.key}
                </span>
                <h1 className="truncate text-xl font-semibold text-slate-900">{project.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    project.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {project.status}
                </span>
                {project.currentUserRole && (
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PROJECT_ROLE_COLOR[project.currentUserRole]}`}>
                    {project.currentUserRole}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{project.description}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {canManage && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Edit
                </button>
              )}
              {canManage && project.status === 'ACTIVE' && (
                <button
                  onClick={() => setConfirmArchive(true)}
                  disabled={isArchiving}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {isArchiving ? 'Archiving…' : 'Archive'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white px-8">
        <div className="mx-auto max-w-5xl">
          <nav className="-mb-px flex gap-6">
            {(['tasks', 'sprints', 'members'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setTab(tab)}
                className={`border-b-2 pb-3 pt-1 text-sm font-medium capitalize transition ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'tasks' ? 'Tasks' : tab === 'sprints' ? 'Sprints' : 'Members'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-8 py-8 space-y-8">
        {/* Tasks tab */}
        {activeTab === 'tasks' && (
          <TaskList projectId={id!} currentUserRole={project.currentUserRole} isWorkspaceAdmin={isWorkspaceAdmin} />
        )}

        {/* Sprints tab */}
        {activeTab === 'sprints' && (
          <SprintList projectId={id!} canManage={canManage} />
        )}

        {/* Members tab */}
        {activeTab === 'members' && <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Members{members ? ` (${members.length})` : ''}
            </h2>
            {canManage && (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add member
              </button>
            )}
          </div>

          {!members && <Spinner size="md" />}

          {members && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3.5 text-left font-medium text-slate-600">Member</th>
                    <th className="px-5 py-3.5 text-left font-medium text-slate-600">Role</th>
                    <th className="px-5 py-3.5 text-left font-medium text-slate-600">Joined</th>
                    {canManage && (
                      <th className="px-5 py-3.5 text-right font-medium text-slate-600">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.userId} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={m.fullName} imageUrl={m.avatarUrl} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{m.fullName}</p>
                            <p className="truncate text-xs text-slate-500">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${PROJECT_ROLE_COLOR[m.role]}`}>
                          {m.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">
                        {new Date(m.joinedAt).toLocaleDateString()}
                      </td>
                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setConfirmRemove({ userId: m.userId, name: m.fullName })}
                            className="text-xs font-medium text-red-500 transition hover:text-red-700"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>}
      </div>
    </div>
  )
}
