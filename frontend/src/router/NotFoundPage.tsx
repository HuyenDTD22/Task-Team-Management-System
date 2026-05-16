import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="select-none text-[120px] font-black leading-none text-slate-100">404</p>
      <h1 className="-mt-4 text-3xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-500">
        The page you're looking for doesn't exist or has been moved. Head back to safety.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          Go to Dashboard
        </Link>
        <Link
          to="/login"
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-300 transition-colors hover:bg-slate-50"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}
