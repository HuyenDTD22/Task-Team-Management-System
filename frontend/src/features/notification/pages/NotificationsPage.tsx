import { useSearchParams } from 'react-router-dom'
import { Pagination } from '@/components/ui/Pagination'
import { Spinner } from '@/components/ui/Spinner'
import { useNotifications } from '../hooks/useNotificationQueries'
import { useMarkAllNotificationsRead } from '../hooks/useNotificationMutations'
import { NotificationItem } from '../components/NotificationItem'
import type { NotificationFilterParams } from '@/types/common.types'

function BellIcon() {
  return (
    <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  )
}

export function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { mutate: markAll, isPending: isMarkingAll } = useMarkAllNotificationsRead()

  const filter = searchParams.get('filter') as 'unread' | null
  const page   = Number(searchParams.get('page') ?? '0')
  const size   = Number(searchParams.get('size') ?? '10')

  const params: NotificationFilterParams = {
    page,
    size,
    isRead: filter === 'unread' ? false : undefined,
  }

  const { data, isLoading } = useNotifications(params)

  const unreadTotal = data?.content.filter((n) => !n.read).length ?? 0

  function setFilter(f: 'all' | 'unread') {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (f === 'unread') next.set('filter', 'unread')
      else next.delete('filter')
      next.set('page', '0')
      return next
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">Stay up to date with your team activity.</p>
        </div>
        {(data?.totalElements ?? 0) > 0 && (
          <button
            onClick={() => markAll()}
            disabled={isMarkingAll || unreadTotal === 0}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isMarkingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Filter toggle */}
      <div className="mb-4 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1 w-fit">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              (filter === 'unread') === (f === 'unread')
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f === 'all' ? 'All' : 'Unread'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !data || data.totalElements === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-20 text-center">
          <div className="text-slate-300">
            <BellIcon />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-500">No notifications yet</p>
          <p className="mt-1 text-xs text-slate-400">
            {filter === 'unread'
              ? 'You have no unread notifications.'
              : 'Notifications will appear here when you get assigned tasks, receive comments, and more.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.content.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.totalElements > 0 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          pageSize={size}
          onPageChange={(p) =>
            setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('page', String(p)); return next })
          }
          onPageSizeChange={(s) =>
            setSearchParams((prev) => { const next = new URLSearchParams(prev); next.set('size', String(s)); next.set('page', '0'); return next })
          }
        />
      )}
    </div>
  )
}
