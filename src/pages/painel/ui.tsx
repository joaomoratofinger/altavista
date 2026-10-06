import type { ReactNode } from 'react'

export const inputClass =
  'w-full border border-line bg-white/60 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-gold disabled:opacity-50'

export const primaryButton =
  'eyebrow inline-block bg-gold px-6 py-3.5 text-center text-ink transition-colors hover:bg-gold-soft hover:text-bone disabled:cursor-not-allowed disabled:opacity-50'

export const ghostButton =
  'eyebrow inline-block border border-line px-5 py-3 text-center text-ink transition-colors hover:border-gold-soft disabled:cursor-not-allowed disabled:opacity-50'

export function Field({
  label,
  hint,
  className = '',
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <label className={`block ${className}`}>
      <span className="eyebrow text-mute">{label}</span>
      <span className="mt-2 block">{children}</span>
      {hint && <span className="mt-1.5 block text-xs text-mute">{hint}</span>}
    </label>
  )
}

export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error'
  children: ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : undefined}
      className={`border px-4 py-3 text-sm ${
        tone === 'error'
          ? 'border-red-300 bg-red-50 text-red-800'
          : 'border-line bg-paper-soft text-ink/80'
      }`}
    >
      {children}
    </p>
  )
}
