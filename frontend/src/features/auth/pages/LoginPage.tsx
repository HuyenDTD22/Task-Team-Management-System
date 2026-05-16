import { Link } from 'react-router-dom'
import { LoginForm } from '@/features/auth/components/LoginForm'

function LogoIcon() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  )
}

export function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-4 py-12">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-indigo-800/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <LogoIcon />
          </div>
          <span className="text-xl font-bold text-white">TaskManager</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-2xl shadow-black/40">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1.5 text-sm text-slate-500">Sign in to your account to continue</p>
          </div>

          <LoginForm />

          <p className="mt-7 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-slate-600">
          © 2026 TaskManager · All rights reserved
        </p>
      </div>
    </div>
  )
}
