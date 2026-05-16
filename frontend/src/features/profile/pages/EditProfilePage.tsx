import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useCurrentUser } from '@/features/user/hooks/useCurrentUser'
import { useUpdateProfile } from '@/features/user/hooks/useUpdateProfile'
import { useUpdateAvatar } from '@/features/user/hooks/useUpdateAvatar'
import { Avatar } from '@/components/ui/Avatar'
import type { AxiosError } from 'axios'
import type { ApiError } from '@/types/common.types'

const schema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
})

type FormValues = z.infer<typeof schema>

// ── Icons ────────────────────────────────────────────────────────────────────

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

// ── Avatar Section ────────────────────────────────────────────────────────────
// Completely independent from the profile text form.
// Flow: pick file → preview shown locally → explicit "Upload photo" button → PATCH /users/me/avatar

interface AvatarSectionProps {
  displayName: string
  currentAvatarUrl?: string | null
}

function AvatarSection({ displayName, currentAvatarUrl }: AvatarSectionProps) {
  const {
    mutate: uploadAvatar,
    isPending: isUploading,
    isSuccess: isUploaded,
    error: uploadError,
    reset: resetUpload,
  } = useUpdateAvatar()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadErrorMsg = (uploadError as AxiosError<ApiError> | null)?.response?.data?.message

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    resetUpload()

    // Reset so selecting the same file again triggers onChange
    e.target.value = ''
  }

  function handleUpload() {
    if (!pendingFile) return

    // Calls PATCH /api/v1/users/me/avatar — completely independent from profile form
    uploadAvatar(pendingFile, {
      onSuccess: () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPendingFile(null)
        setPreviewUrl(null)
      },
    })
  }

  function handleDiscard() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
    resetUpload()
  }

  // What the avatar shows: local preview (not yet uploaded) → server URL → initials
  const displayAvatarUrl = previewUrl ?? currentAvatarUrl

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-sm font-semibold text-slate-700">Profile Photo</h2>

      <div className="flex items-start gap-6">
        <div className="relative shrink-0">
          <Avatar name={displayName} imageUrl={displayAvatarUrl} size="xl" />
          {pendingFile && (
            <span className="absolute -bottom-1 -right-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              NEW
            </span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          {/* Status feedback */}
          {uploadErrorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
              <AlertIcon />
              {uploadErrorMsg}
            </div>
          )}
          {isUploaded && !pendingFile && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
              <CheckCircleIcon />
              Avatar updated successfully
            </div>
          )}

          {/* Pending file info */}
          {pendingFile && (
            <p className="text-xs text-amber-600">
              {pendingFile.name} — click Upload to save
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingFile ? 'Choose another' : 'Change photo'}
            </button>

            {pendingFile && (
              <>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Uploading…
                    </>
                  ) : (
                    'Upload photo'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={isUploading}
                  className="rounded-lg px-3.5 py-2 text-sm text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
                >
                  Discard
                </button>
              </>
            )}
          </div>

          <p className="text-xs text-slate-400">JPG, PNG or WebP. Max 5 MB.</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}

// ── Profile Form Section ──────────────────────────────────────────────────────
// Completely independent from avatar section.
// Flow: edit fullName → "Save changes" → PATCH /api/v1/users/me

interface ProfileFormSectionProps {
  email: string
  defaultFullName: string
}

function ProfileFormSection({ email, defaultFullName }: ProfileFormSectionProps) {
  const {
    mutate: updateProfile,
    isPending: isSaving,
    error: saveError,
    isSuccess: isSaved,
    reset: resetSave,
  } = useUpdateProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: defaultFullName },
  })

  const serverError = (saveError as AxiosError<ApiError> | null)?.response?.data?.message

  function onSubmit(data: FormValues) {
    // Calls PATCH /api/v1/users/me — only sends fullName, never touches avatar
    updateProfile({ fullName: data.fullName })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-sm font-semibold text-slate-700">Personal Information</h2>

      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => { if (isSaved || saveError) resetSave() }}
        noValidate
        className="space-y-5"
      >
        {serverError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertIcon />
            {serverError}
          </div>
        )}

        {isSaved && !serverError && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircleIcon />
            Profile updated successfully
          </div>
        )}

        {/* Email — read only, never sent to backend */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email address
          </label>
          <input
            type="email"
            value={email}
            readOnly
            className="block h-11 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-400"
          />
          <p className="mt-1.5 text-xs text-slate-400">Email cannot be changed.</p>
        </div>

        {/* Full name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            {...register('fullName')}
            className={`block h-11 w-full rounded-lg border px-3.5 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-inset ${
              errors.fullName
                ? 'border-red-400 bg-red-50 focus:ring-red-200'
                : 'border-slate-300 bg-white focus:border-indigo-500 focus:ring-indigo-100'
            }`}
          />
          {errors.fullName && (
            <p className="mt-1.5 text-xs text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function EditProfilePage() {
  const { user: storeUser } = useAuthStore()
  const { data: freshUser } = useCurrentUser()

  const user = freshUser ?? storeUser

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      {/* Back nav */}
      <div className="mb-8 flex items-center gap-4">
        <Link
          to="/profile"
          className="flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Profile
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Edit Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Update your personal information</p>
      </div>

      <div className="space-y-6">
        {/* Avatar section — PATCH /api/v1/users/me/avatar */}
        <AvatarSection
          displayName={user?.fullName ?? ''}
          currentAvatarUrl={user?.avatarUrl}
        />

        {/* Profile form — PATCH /api/v1/users/me */}
        <ProfileFormSection
          email={user?.email ?? ''}
          defaultFullName={user?.fullName ?? ''}
        />
      </div>
    </div>
  )
}
