import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMyWorkspaces } from '@/features/workspace/hooks/useWorkspaceQueries'
import { useCreateWorkspace } from '@/features/workspace/hooks/useWorkspaceMutations'
import { useDebounce } from '@/hooks/useDebounce'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import type { WorkspaceRole, WorkspaceFilterParams } from '@/types/common.types'

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<WorkspaceRole, string> = {
  OWNER: 'bg-indigo-100 text-indigo-700',
  ADMIN: 'bg-amber-100 text-amber-700',
  MEMBER: 'bg-slate-100 text-slate-600',
}

// ── Create workspace modal ────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void
}

function CreateWorkspaceModal({ onClose }: CreateModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const { mutate, isPending, error } = useCreateWorkspace()

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
        <h2 className="mb-1 text-lg font-semibold text-slate-900">New workspace</h2>
        <p className="mb-5 text-sm text-slate-500">
          A workspace groups related projects and their members.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Company"
              maxLength={100}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
              disabled={isPending || !name.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending && <Spinner size="sm" />}
              {isPending ? 'Creating…' : 'Create workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Workspace card ────────────────────────────────────────────────────────────

interface WorkspaceCardProps {
  id: string
  name: string
  slug: string
  role: WorkspaceRole
  memberCount: number
}

function WorkspaceCard({ id, name, slug, role, memberCount }: WorkspaceCardProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <Link
      to={`/workspaces/${id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white">
          {initials}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLOR[role]}`}>
          {role}
        </span>
      </div>

      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
          {name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{slug}</p>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        {memberCount} {memberCount === 1 ? 'member' : 'members'}
      </div>
    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function WorkspacesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (debouncedSearch) next.set('search', debouncedSearch)
      else next.delete('search')
      next.delete('page')
      return next
    }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  const search = searchParams.get('search') ?? ''
  const sortBy = searchParams.get('sortBy') ?? 'createdAt'
  const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') ?? 'desc'
  const page = Number(searchParams.get('page') ?? '0')
  const size = Number(searchParams.get('size') ?? '10')

  const params: WorkspaceFilterParams = {
    search: search || undefined,
    sortBy,
    sortDir,
    page,
    size,
  }

  const { data: workspaces, isLoading, isError } = useMyWorkspaces(params)

  function setParam(key: string, value: string | undefined) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      if (key !== 'page') next.delete('page')
      return next
    })
  }

  const isEmpty = !isLoading && !isError && workspaces?.totalElements === 0

  return (
    <div className="min-h-full bg-slate-50">
      {showCreate && <CreateWorkspaceModal onClose={() => setShowCreate(false)} />}

      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Workspaces</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {workspaces ? `${workspaces.totalElements} workspace${workspaces.totalElements !== 1 ? 's' : ''}` : 'Your workspaces and their projects'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New workspace
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-5xl px-8 py-8">

        {/* Filter bar */}
        {!isLoading && !isError && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search workspaces…"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={`${sortBy}:${sortDir}`}
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
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
            Failed to load workspaces. Please refresh.
          </div>
        )}

        {isEmpty && !search && (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
              <svg className="h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-700">No workspaces yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first workspace to get started.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-6 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Create workspace
            </button>
          </div>
        )}

        {isEmpty && search && (
          <div className="flex flex-col items-center py-20 text-center">
            <p className="font-medium text-slate-700">No workspaces match "{search}"</p>
            <button
              onClick={() => setSearchInput('')}
              className="mt-3 text-sm text-indigo-600 hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {!isLoading && !isError && workspaces && workspaces.totalElements > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workspaces.content.map((ws) => (
                <WorkspaceCard
                  key={ws.id}
                  id={ws.id}
                  name={ws.name}
                  slug={ws.slug}
                  role={ws.currentUserRole}
                  memberCount={ws.memberCount}
                />
              ))}
            </div>

            <Pagination
              page={page}
              totalPages={workspaces.totalPages}
              totalElements={workspaces.totalElements}
              pageSize={size}
              onPageChange={(p) => setParam('page', String(p))}
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
      </div>
    </div>
  )
}
