import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { useDebounce } from '@/hooks/useDebounce'
import { useWorkspace, useWorkspaceMembers } from '@/features/workspace/hooks/useWorkspaceQueries'
import {
  useDeleteWorkspace,
  useUpdateWorkspace,
  useUpdateMemberRole,
  useRemoveWorkspaceMember,
  useAddWorkspaceMember,
} from '@/features/workspace/hooks/useWorkspaceMutations'
import { useWorkspaceProjects } from '@/features/project/hooks/useProjectQueries'
import { useCreateProject } from '@/features/project/hooks/useProjectMutations'
import { userApi } from '@/api/endpoints/user.api'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { Pagination } from '@/components/ui/Pagination'
import type { WorkspaceRole, ProjectFilterParams } from '@/types/common.types'
import type { UserResponse } from '@/types/auth.types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<WorkspaceRole, string> = {
  OWNER: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-amber-100 text-amber-700',
  MEMBER: 'bg-slate-100 text-slate-600',
}

const PROJECT_ROLE_COLOR = {
  MANAGER: 'bg-purple-100 text-purple-700',
  DEVELOPER: 'bg-blue-100 text-blue-700',
  VIEWER: 'bg-slate-100 text-slate-500',
} as const

const WORKSPACE_ROLES: WorkspaceRole[] = ['ADMIN', 'MEMBER']

// ── Edit workspace modal ───────────────────────────────────────────────────────

interface EditWorkspaceModalProps {
  id: string
  initialName: string
  initialDescription: string | null
  onClose: () => void
}

function EditWorkspaceModal({ id, initialName, initialDescription, onClose }: EditWorkspaceModalProps) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const { mutate, isPending, error } = useUpdateWorkspace(id)
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
        <h2 className="mb-1 text-lg font-semibold text-slate-900">Edit workspace</h2>
        <p className="mb-5 text-sm text-slate-500">Update workspace name and description.</p>

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
              maxLength={500}
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

// ── Add workspace member modal ────────────────────────────────────────────────

interface AddMemberModalProps {
  workspaceId: string
  onClose: () => void
}

function AddMemberModal({ workspaceId, onClose }: AddMemberModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('MEMBER')
  const [found, setFound] = useState<UserResponse | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const { mutate, isPending, error } = useAddWorkspaceMember(workspaceId)
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
        <p className="mb-5 text-sm text-slate-500">Search by email to invite someone to this workspace.</p>

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
                <Avatar name={found.fullName} imageUrl={found.avatarUrl ?? null} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{found.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{found.email}</p>
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as WorkspaceRole)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                >
                  {WORKSPACE_ROLES.map((r) => (
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

// ── Create project modal ──────────────────────────────────────────────────────

interface CreateProjectModalProps {
  workspaceId: string
  onClose: () => void
}

function CreateProjectModal({ workspaceId, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [keyTouched, setKeyTouched] = useState(false)
  const { mutate, isPending, error } = useCreateProject(workspaceId)
  const apiError = error as { response?: { data?: { message?: string } } } | null

  function deriveKey(value: string) {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!keyTouched) {
      setKey(deriveKey(value.split(' ').map((w) => w[0] ?? '').join('')))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutate(
      { name: name.trim(), key: key.trim(), description: description.trim() || undefined },
      { onSuccess: onClose },
    )
  }

  const keyValid = /^[A-Z0-9]{1,10}$/.test(key)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-lg font-semibold text-slate-900">New project</h2>
        <p className="mb-5 text-sm text-slate-500">Projects hold tasks, sprints, and boards.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Backend API"
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Key <span className="text-red-500">*</span>
            </label>
            <input
              value={key}
              onChange={(e) => { setKeyTouched(true); setKey(deriveKey(e.target.value)) }}
              placeholder="e.g. API"
              maxLength={10}
              required
              className={`w-full rounded-lg border px-3 py-2.5 font-mono text-sm uppercase outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${
                key && !keyValid
                  ? 'border-red-300 focus:border-red-400'
                  : 'border-slate-300 focus:border-indigo-500'
              }`}
            />
            <p className="mt-1 text-xs text-slate-500">
              Uppercase letters and digits only. Used to prefix task IDs (e.g. API-1).
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              maxLength={1000}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {apiError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {apiError.response?.data?.message ?? 'Something went wrong. Please try again.'}
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
              disabled={isPending || !name.trim() || !keyValid}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending && <Spinner size="sm" />}
              {isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'projects' | 'members'

export function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tab = (searchParams.get('tab') as Tab | null) ?? 'projects'
  const [showCreate, setShowCreate] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)

  // Project filter params from URL
  const projectSearch = searchParams.get('search') ?? ''
  const projectStatus = (searchParams.get('status') as ProjectFilterParams['status']) ?? undefined
  const projectSortBy = searchParams.get('sortBy') ?? 'createdAt'
  const projectSortDir = (searchParams.get('sortDir') as 'asc' | 'desc') ?? 'desc'
  const projectPage = Number(searchParams.get('page') ?? '0')
  const projectSize = Number(searchParams.get('size') ?? '10')

  const [projectSearchInput, setProjectSearchInput] = useState(() => projectSearch)
  const debouncedProjectSearch = useDebounce(projectSearchInput, 300)

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedProjectSearch) next.set('search', debouncedProjectSearch)
      else next.delete('search')
      next.delete('page')
      return next
    }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProjectSearch])

  const projectParams: ProjectFilterParams = {
    search: projectSearch || undefined,
    status: projectStatus,
    sortBy: projectSortBy,
    sortDir: projectSortDir,
    page: projectPage,
    size: projectSize,
  }

  const { data: workspace, isLoading, isError, error } = useWorkspace(id!)
  const { data: projects } = useWorkspaceProjects(id!, projectParams)
  const { data: members } = useWorkspaceMembers(id!)
  const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace()
  const { mutate: updateMemberRole } = useUpdateMemberRole(id!)
  const { mutate: removeMember } = useRemoveWorkspaceMember(id!)

  function setTab(t: Tab) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', t)
      next.delete('search')
      next.delete('status')
      next.delete('sortBy')
      next.delete('sortDir')
      next.delete('page')
      return next
    })
  }

  function setProjectParam(key: string, value: string | undefined) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
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

  if (isError || !workspace) {
    if (is403) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4">
          <p className="text-slate-600">You no longer have access to this workspace.</p>
          <p className="text-sm text-slate-400">Redirecting to workspaces…</p>
          <Link to="/workspaces" className="text-sm text-indigo-600 hover:underline">
            Go now
          </Link>
        </div>
      )
    }
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-slate-500">Workspace not found or you don't have access.</p>
        <Link to="/workspaces" className="text-sm text-indigo-600 hover:underline">
          Back to workspaces
        </Link>
      </div>
    )
  }

  const isAdmin = workspace.currentUserRole === 'OWNER' || workspace.currentUserRole === 'ADMIN'
  const isOwner = workspace.currentUserRole === 'OWNER'

  function handleDelete() {
    if (!confirm(`Delete workspace "${workspace!.name}"? This cannot be undone.`)) return
    deleteWorkspace(workspace!.id, {
      onSuccess: () => navigate('/workspaces'),
    })
  }

  return (
    <div className="min-h-full bg-slate-50">
      {showCreate && (
        <CreateProjectModal workspaceId={id!} onClose={() => setShowCreate(false)} />
      )}
      {showEdit && (
        <EditWorkspaceModal
          id={id!}
          initialName={workspace.name}
          initialDescription={workspace.description}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showAddMember && (
        <AddMemberModal workspaceId={id!} onClose={() => setShowAddMember(false)} />
      )}

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-1 flex items-center gap-2 text-sm text-slate-500">
            <Link to="/workspaces" className="shrink-0 hover:text-indigo-600">Workspaces</Link>
            <span className="shrink-0">/</span>
            <span className="min-w-0 truncate text-slate-700">{workspace.name}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
                {workspace.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-slate-900">{workspace.name}</h1>
                <p className="truncate text-sm text-slate-500">{workspace.slug}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLOR[workspace.currentUserRole]}`}>
                {workspace.currentUserRole}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => setShowEdit(true)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Edit
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  New project
                </button>
              )}
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          </div>

          {workspace.description && (
            <p className="mt-3 line-clamp-2 text-sm text-slate-600">{workspace.description}</p>
          )}

          {/* Tabs */}
          <div className="mt-5 flex gap-6 border-b border-transparent">
            {(['projects', 'members'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`-mb-px border-b-2 pb-3 text-sm font-medium capitalize transition ${
                  tab === t
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
                {t === 'projects' && projects != null && (
                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {projects.totalElements}
                  </span>
                )}
                {t === 'members' && members != null && (
                  <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {members.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="mx-auto max-w-5xl px-8 py-8">

        {/* Projects tab */}
        {tab === 'projects' && (
          <>
            {/* Filter bar */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-48">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="search"
                  value={projectSearchInput}
                  onChange={(e) => setProjectSearchInput(e.target.value)}
                  placeholder="Search projects…"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <select
                value={projectStatus ?? ''}
                onChange={(e) => setProjectParam('status', e.target.value || undefined)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <select
                value={`${projectSortBy}:${projectSortDir}`}
                onChange={(e) => {
                  const [by, dir] = e.target.value.split(':')
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('sortBy', by)
                    next.set('sortDir', dir)
                    next.delete('page')
                    return next
                  })
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="createdAt:desc">Newest first</option>
                <option value="createdAt:asc">Oldest first</option>
                <option value="name:asc">Name A–Z</option>
                <option value="name:desc">Name Z–A</option>
              </select>
            </div>

            {!projects && (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            )}

            {projects?.totalElements === 0 && (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
                  <svg className="h-7 w-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <p className="font-medium text-slate-700">
                  {projectSearch || projectStatus ? 'No projects match your filters' : 'No projects yet'}
                </p>
                {isAdmin && !projectSearch && !projectStatus && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-4 text-sm text-indigo-600 hover:underline"
                  >
                    Create your first project
                  </button>
                )}
              </div>
            )}

            {projects && projects.totalElements > 0 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.content.map((p) => (
                    <Link
                      key={p.id}
                      to={`/projects/${p.id}`}
                      className="group flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                          {p.key}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            p.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>

                      <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {p.name}
                      </p>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{p.memberCount} {p.memberCount === 1 ? 'member' : 'members'}</span>
                        {p.currentUserRole && (
                          <span className={`rounded-full px-2 py-0.5 font-medium ${PROJECT_ROLE_COLOR[p.currentUserRole]}`}>
                            {p.currentUserRole}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                <Pagination
                  page={projectPage}
                  totalPages={projects.totalPages}
                  totalElements={projects.totalElements}
                  pageSize={projectSize}
                  onPageChange={(p) => setProjectParam('page', String(p))}
                  onPageSizeChange={(s) => {
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev)
                      next.set('size', String(s))
                      next.delete('page')
                      return next
                    })
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Members tab */}
        {tab === 'members' && (
          <>
            {isAdmin && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add member
                </button>
              </div>
            )}

            {!members && (
              <div className="flex justify-center py-10">
                <Spinner size="lg" />
              </div>
            )}

            {members && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-3.5 text-left font-medium text-slate-600">Member</th>
                      <th className="px-5 py-3.5 text-left font-medium text-slate-600">Role</th>
                      <th className="px-5 py-3.5 text-left font-medium text-slate-600">Joined</th>
                      {isAdmin && (
                        <th className="px-5 py-3.5 text-right font-medium text-slate-600">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m) => {
                      const canEdit = isAdmin && m.role !== 'OWNER'
                      return (
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
                            {canEdit ? (
                              <select
                                defaultValue={m.role}
                                onChange={(e) =>
                                  updateMemberRole({ userId: m.userId, role: e.target.value as WorkspaceRole })
                                }
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                              >
                                {WORKSPACE_ROLES.map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLOR[m.role]}`}>
                                {m.role}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500">
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-4 text-right">
                              {canEdit && (
                                <button
                                  onClick={() => {
                                    if (!confirm(`Remove ${m.fullName} from this workspace?`)) return
                                    removeMember(m.userId)
                                  }}
                                  className="text-xs font-medium text-red-500 transition hover:text-red-700"
                                >
                                  Remove
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
