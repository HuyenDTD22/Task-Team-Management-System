interface Props {
  title: string
  message: string
  onClose: () => void
}

export function AlertDialog({ title, message, onClose }: Readonly<Props>) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-base font-semibold text-slate-900">{title}</h2>
        <p className="mb-6 text-sm text-slate-500">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}
