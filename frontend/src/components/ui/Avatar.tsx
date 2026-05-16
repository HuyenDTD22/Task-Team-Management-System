interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const PALETTE = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-rose-500',
]

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

function pickColor(name: string): string {
  const code = name ? name.charCodeAt(0) : 0
  return PALETTE[code % PALETTE.length]
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover ring-2 ring-white`}
      />
    )
  }

  return (
    <div
      aria-label={name}
      className={`${SIZE_CLASSES[size]} ${pickColor(name)} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
    >
      {getInitials(name)}
    </div>
  )
}
