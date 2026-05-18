import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { Avatar } from '@/components/ui/Avatar'
import { useUnreadNotificationCount } from '@/features/notification/hooks/useNotificationQueries'

// ── Icons ────────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  )
}

function ClipboardListIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  )
}

function ChevronUpIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  )
}

function UserCircleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  )
}

function CogIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.282c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}

// ── Nav item ─────────────────────────────────────────────────────────────────

interface SidebarItem {
  path: string
  label: string
  icon: ReactNode
  comingSoon?: boolean
}

function NavItem({ path, label, icon, comingSoon = false }: Readonly<SidebarItem>) {
  if (comingSoon) {
    return (
      <div className="flex cursor-not-allowed select-none items-center gap-3 rounded-lg px-3 py-2.5 text-slate-500">
        {icon}
        <span className="text-sm">{label}</span>
        <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-700/50 text-slate-400">
          Soon
        </span>
      </div>
    )
  }

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

const NAV_MAIN: SidebarItem[] = [
  { path: '/dashboard',  label: 'Dashboard',  icon: <GridIcon /> },
  { path: '/workspaces', label: 'Workspaces', icon: <FolderIcon /> },
  { path: '/tasks',      label: 'My Tasks',   icon: <ClipboardListIcon /> },
]

// ── Notification bell ─────────────────────────────────────────────────────────

function formatUnreadCount(count: number): string | null {
  if (count > 99) return '99+'
  if (count > 0) return String(count)
  return null
}

function NotificationBell() {
  const { data: count = 0 } = useUnreadNotificationCount()
  const display = formatUnreadCount(count)

  return (
    <div className="mt-0.5">
      <NavLink
        to="/notifications"
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            isActive
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        <span className="relative flex h-5 w-5 shrink-0">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {display && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold leading-none text-white">
              {display}
            </span>
          )}
        </span>
        {' Notifications'}
      </NavLink>
    </div>
  )
}

// ── User dropdown ─────────────────────────────────────────────────────────────

function UserDropdown() {
  const { user } = useAuthStore()
  const { mutate: logout, isPending: isLoggingOut } = useLogout()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  return (
    <div ref={containerRef} className="relative px-3 py-3">
      {/* Dropdown panel */}
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-xl">
          {/* User info header */}
          <div className="border-b border-slate-700 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{user?.fullName}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1.5">
            <button
              onClick={() => go('/profile')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <UserCircleIcon />
              View Profile
            </button>
            <button
              onClick={() => go('/profile/edit')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <PencilIcon />
              Edit Profile
            </button>
            <button
              onClick={() => go('/settings')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            >
              <CogIcon />
              Settings
            </button>
          </div>

          {/* Sign out */}
          <div className="border-t border-slate-700 py-1.5">
            <button
              onClick={() => { setOpen(false); logout() }}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-slate-700 hover:text-red-300 disabled:opacity-50"
            >
              <SignOutIcon />
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
          open ? 'bg-slate-800' : 'hover:bg-slate-800'
        }`}
      >
        <Avatar name={user?.fullName ?? ''} imageUrl={user?.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-white">{user?.fullName}</p>
          <p className="truncate text-xs text-slate-400">{user?.email}</p>
        </div>
        <ChevronUpIcon open={open} />
      </button>
    </div>
  )
}

// ── Layout ───────────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <aside className="flex w-64 shrink-0 flex-col bg-slate-900">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 border-b border-white/5 px-5 py-4 hover:opacity-80 transition-opacity">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
          </div>
          <span className="font-semibold text-white">TaskManager</span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Main
          </p>
          <div className="space-y-0.5">
            {NAV_MAIN.map((item) => <NavItem key={item.path} {...item} />)}
          </div>
          <NotificationBell />
        </nav>

        {/* User section with dropdown */}
        <div className="border-t border-white/5">
          <UserDropdown />
        </div>
      </aside>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
