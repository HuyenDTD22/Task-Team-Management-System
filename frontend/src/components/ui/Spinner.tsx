interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-[2px]',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-spin rounded-full border-slate-200 border-t-indigo-600 ${SIZE[size]} ${className}`}
    />
  )
}
