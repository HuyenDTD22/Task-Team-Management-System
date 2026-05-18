import { useNavigate } from 'react-router-dom'
import type { Notification, NotificationType } from '@/types/notification.types'
import { useMarkNotificationRead } from '../hooks/useNotificationMutations'

// ── Time formatting ───────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(isoString).toLocaleDateString()
}

// ── Type icons ────────────────────────────────────────────────────────────────

function NotificationIcon({ type }: { type: NotificationType }) {
  switch (type) {
    case 'TASK_ASSIGNED':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </span>
      )
    case 'COMMENT_ADDED':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </span>
      )
    case 'SPRINT_STARTED':
    case 'SPRINT_COMPLETED':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        </span>
      )
    case 'PROJECT_MEMBER_ADDED':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
        </span>
      )
    case 'WORKSPACE_MEMBER_ADDED':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
        </span>
      )
  }
}

// ── Item ─────────────────────────────────────────────────────────────────────

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification: n }: NotificationItemProps) {
  const navigate = useNavigate()
  const { mutate: markRead } = useMarkNotificationRead()

  function handleClick() {
    if (!n.read) markRead(n.id)
    if (!n.entityId) return
    if (n.entityType === 'TASK') {
      navigate(`/tasks?taskId=${n.entityId}`)
    } else if (n.entityType === 'PROJECT') {
      const tab = n.type.startsWith('SPRINT') ? '?tab=sprints' : ''
      navigate(`/projects/${n.entityId}${tab}`)
    } else if (n.entityType === 'WORKSPACE') {
      navigate(`/workspaces/${n.entityId}`)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-slate-50 ${
        n.read
          ? 'border-slate-100 bg-white'
          : 'border-indigo-100 bg-indigo-50/40'
      }`}
    >
      <NotificationIcon type={n.type} />

      <div className="min-w-0 flex-1">
        <p className={`text-sm ${n.read ? 'font-normal text-slate-700' : 'font-semibold text-slate-900'}`}>
          {n.title}
        </p>
        {n.message && (
          <p className="mt-0.5 truncate text-xs text-slate-500">{n.message}</p>
        )}
        <p className="mt-1 text-[11px] text-slate-400">{formatTimeAgo(n.createdAt)}</p>
      </div>

      {!n.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
      )}
    </button>
  )
}
