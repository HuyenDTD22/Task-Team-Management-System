const PAGE_SIZES = [5, 10, 20] as const

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Readonly<PaginationProps>) {
  if (totalElements === 0) return null

  // Use the max of backend-reported totalPages and locally-computed value.
  // This prevents stale placeholder data (from a previous page size) from
  // incorrectly disabling Next while the new query is still in-flight.
  const safeTotalPages = Math.max(totalPages, Math.ceil(totalElements / pageSize), 1)
  const isFirst = page <= 0
  const isLast = page >= safeTotalPages - 1
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)

  const btnClass =
    'inline-flex items-center justify-center rounded-md border border-slate-300 p-1.5 text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-transparent disabled:hover:text-slate-500'

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

      {/* Left — navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(0)}
          disabled={isFirst}
          aria-label="First page"
          className={btnClass}
        >
          {/* ChevronDoubleLeft */}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          onClick={() => onPageChange(page - 1)}
          disabled={isFirst}
          aria-label="Previous page"
          className={btnClass}
        >
          {/* ChevronLeft */}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <span className="select-none px-3 text-sm text-slate-600">
          Page {page + 1} of {safeTotalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={isLast}
          aria-label="Next page"
          className={btnClass}
        >
          {/* ChevronRight */}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <button
          onClick={() => onPageChange(safeTotalPages - 1)}
          disabled={isLast}
          aria-label="Last page"
          className={btnClass}
        >
          {/* ChevronDoubleRight */}
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Right — page size + count */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-slate-400">·</span>
        <span>{from}–{to} of {totalElements}</span>
      </div>

    </div>
  )
}
