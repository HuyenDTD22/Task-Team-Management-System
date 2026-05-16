import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRegister } from '@/features/auth/hooks/useRegister'
import type { ApiError } from '@/types/common.types'
import type { AxiosError } from 'axios'

const schema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name cannot exceed 100 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

function AlertIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

function inputClass(hasError: boolean) {
  return `block h-11 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-inset ${
    hasError
      ? 'border-red-400 bg-red-50 focus:ring-red-200'
      : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100'
  }`
}

export function RegisterForm() {
  const { mutate: register, isPending, error } = useRegister()

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const serverMessage = (error as AxiosError<ApiError> | null)?.response?.data?.message

  const onSubmit = (data: FormValues) => {
    register({ fullName: data.fullName, email: data.email, password: data.password })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverMessage && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertIcon />
          {serverMessage}
        </div>
      )}

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
          Full name
        </label>
        <input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder="Alex Johnson"
          {...field('fullName')}
          className={inputClass(!!errors.fullName)}
        />
        {errors.fullName && (
          <p className="mt-1.5 text-xs text-red-600">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...field('email')}
          className={inputClass(!!errors.email)}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          {...field('password')}
          className={inputClass(!!errors.password)}
        />
        {errors.password && (
          <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          {...field('confirmPassword')}
          className={inputClass(!!errors.confirmPassword)}
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex h-11 w-full items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 active:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Creating account…
          </span>
        ) : (
          'Create account'
        )}
      </button>
    </form>
  )
}
