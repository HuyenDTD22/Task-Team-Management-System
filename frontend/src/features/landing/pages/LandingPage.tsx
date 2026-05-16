import { Link } from 'react-router-dom'

// ── Icons ────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-5 w-5 shrink-0 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

// ── Feature data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
      </svg>
    ),
    title: 'Workspaces & Projects',
    desc: 'Organize your teams into workspaces and break work down into projects with fine-grained role controls.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    title: 'Kanban Board',
    desc: 'Visualize your workflow with a drag-and-drop Kanban board. Move tasks across columns in one click.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
    title: 'Sprint Planning',
    desc: 'Plan agile sprints, set goals, and track progress from start to close — all in one place.',
    color: 'text-sky-600',
    bg: 'bg-sky-50',
  },
]

const CHECKLIST = [
  'Unlimited team members',
  'Kanban board & sprint planner',
  'Role-based access control',
  'Secure JWT authentication',
  'REST API with full documentation',
  'Docker-ready for self-hosting',
]

// ── Sections ─────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <LogoIcon />
          </div>
          <span className="font-bold text-white">TaskManager</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Get started free
          </Link>
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-900 pt-24">
      {/* Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-20 text-center">
        {/* Badge */}
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
          Open source · Self-hostable
        </span>

        {/* Headline */}
        <h1 className="mx-auto max-w-3xl text-5xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
          Manage projects.{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Empower your team.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400">
          A modern, enterprise-grade task management platform — built with Spring Boot and React.
          Track tasks, run sprints, and ship faster together.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            to="/register"
            className="rounded-xl bg-indigo-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40"
          >
            Get started free
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-slate-700 px-7 py-3.5 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
          >
            Sign in
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 flex items-center justify-center gap-12 border-t border-white/5 pt-10">
          {[
            { val: 'Spring Boot 3', label: 'Backend' },
            { val: 'React 19',      label: 'Frontend' },
            { val: 'JWT + OAuth2',  label: 'Auth' },
            { val: 'Docker ready',  label: 'Deploy' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-base font-bold text-white">{s.val}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* App mockup bar */}
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="overflow-hidden rounded-t-2xl border border-slate-700 bg-slate-800 shadow-2xl shadow-black/50">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-slate-700 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/70" />
            <div className="ml-3 flex-1 rounded bg-slate-700 px-3 py-1 text-xs text-slate-400">
              taskmanager.app/dashboard
            </div>
          </div>
          {/* Fake dashboard content */}
          <div className="flex h-48 gap-0">
            <div className="w-48 border-r border-slate-700 p-4 space-y-2">
              {['Dashboard', 'Projects', 'My Tasks'].map((item, i) => (
                <div
                  key={item}
                  className={`h-7 rounded-lg ${i === 0 ? 'bg-indigo-600' : 'bg-slate-700/50'}`}
                />
              ))}
            </div>
            <div className="flex-1 p-5 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-slate-700/60" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-lg bg-slate-700/60" />
                <div className="h-20 rounded-lg bg-slate-700/60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Features</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Everything your team needs</h2>
          <p className="mx-auto mt-4 max-w-lg text-base text-slate-500">
            From task tracking to sprint planning — TaskManager gives teams the structure to move fast.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-100 p-7 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="mb-2 font-semibold text-slate-900">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CtaBanner() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 p-12 text-center shadow-2xl">
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-400/20 blur-2xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mx-auto mt-4 max-w-md text-base text-indigo-200">
              Create your free account and start managing projects in minutes — no credit card required.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {CHECKLIST.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm text-indigo-100"
                >
                  <CheckIcon />
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-10">
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50"
              >
                Create free account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
              <LogoIcon />
            </div>
            <span className="font-semibold text-white">TaskManager</span>
          </div>
          <p className="text-xs text-slate-500">© 2026 TaskManager · All rights reserved</p>
          <div className="flex gap-5 text-xs text-slate-500">
            <Link to="/login" className="hover:text-slate-300 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-slate-300 transition-colors">Sign up</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <CtaBanner />
      <Footer />
    </div>
  )
}
