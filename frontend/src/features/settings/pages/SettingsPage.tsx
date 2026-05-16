import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useChangePassword } from '@/features/user/hooks/useChangePassword'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/common.types'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(100, 'Password is too long'),
    confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Passwords don't match",
    path: ['confirmNewPassword'],
  })

type FormValues = z.infer<typeof schema>

function AlertIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

function PasswordField({
  id,
  label,
  placeholder,
  registration,
  error,
}: {
  id: string
  label: string
  placeholder: string
  registration: object
  error?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          {...registration}
          className={inputClass(!!error)}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {show ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function SettingsPage() {
  const { mutate: changePassword, isPending, error, isSuccess, reset } = useChangePassword()

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const serverError = (error as AxiosError<ApiError> | null)?.response?.data?.message

  function onSubmit(data: FormValues) {
    changePassword(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          resetForm()
        },
      },
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account security and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Change password */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-700">Change Password</h2>
          <p className="mb-6 text-xs text-slate-400">
            Choose a strong password that you don't use anywhere else.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" onChange={() => reset()}>
            {serverError && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertIcon />
                {serverError}
              </div>
            )}

            {isSuccess && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircleIcon />
                Password changed successfully
              </div>
            )}

            <PasswordField
              id="currentPassword"
              label="Current password"
              placeholder="Your current password"
              registration={register('currentPassword')}
              error={errors.currentPassword?.message}
            />

            <PasswordField
              id="newPassword"
              label="New password"
              placeholder="Min. 8 characters"
              registration={register('newPassword')}
              error={errors.newPassword?.message}
            />

            <PasswordField
              id="confirmNewPassword"
              label="Confirm new password"
              placeholder="Re-enter new password"
              registration={register('confirmNewPassword')}
              error={errors.confirmNewPassword?.message}
            />

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving…
                  </>
                ) : (
                  'Update password'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Danger zone placeholder */}
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-red-700">Danger Zone</h2>
          <p className="mb-4 text-xs text-slate-400">
            Irreversible account actions. Proceed with caution.
          </p>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-400 opacity-50"
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}
