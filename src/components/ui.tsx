import type { ReactNode } from 'react'

export const inputClass =
  'w-full border border-line bg-white/60 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-mute/60 focus:border-gold disabled:opacity-50'

export const primaryButton =
  'eyebrow inline-block bg-gold px-6 py-3.5 text-center text-ink transition-colors hover:bg-gold-soft hover:text-bone disabled:cursor-not-allowed disabled:opacity-50'

export const ghostButton =
  'eyebrow inline-block border border-line px-5 py-3 text-center text-ink transition-colors hover:border-gold-soft disabled:cursor-not-allowed disabled:opacity-50'

export const dangerButton =
  'eyebrow inline-block border border-red-300 px-5 py-3 text-center text-red-800 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'

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
  tone?: 'info' | 'error' | 'success'
  children: ReactNode
}) {
  const styles = {
    info: 'border-line bg-paper-soft text-ink/80',
    error: 'border-red-300 bg-red-50 text-red-800',
    success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  }[tone]
  return (
    <p role={tone === 'error' ? 'alert' : undefined} className={`border px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  )
}

/** Campo numérico em texto (aceita "1.200" e "12,5"). */
export function NumField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  hint?: string
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={inputClass} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

export function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-gold)]"
      />
      <span>
        <span className="text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs text-mute">{hint}</span>}
      </span>
    </label>
  )
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-6 border-b border-line pb-3">
        <h2 className="display text-2xl text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-mute">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

/** Texto do termo (rolável) + aceite. O texto vem do banco e é editável no painel. */
export function TermBox({
  title,
  body,
  accepted,
  onChange,
  acceptLabel,
}: {
  title: string
  body: string | null | undefined
  accepted: boolean
  onChange: (v: boolean) => void
  acceptLabel: string
}) {
  return (
    <div className="space-y-4">
      <p className="eyebrow text-mute">{title}</p>
      <div className="max-h-48 overflow-y-auto whitespace-pre-line border border-line bg-white/50 p-4 text-xs leading-relaxed text-ink/80">
        {body ?? 'Carregando termo…'}
      </div>
      <Check checked={accepted} onChange={onChange} label={acceptLabel} />
    </div>
  )
}

export function StatusPill({ tone, children }: { tone: 'wait' | 'ok' | 'bad' | 'neutral'; children: ReactNode }) {
  const styles = {
    wait: 'border-amber-300 bg-amber-50 text-amber-900',
    ok: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    bad: 'border-red-300 bg-red-50 text-red-800',
    neutral: 'border-line bg-paper-soft text-ink/70',
  }[tone]
  return <span className={`eyebrow inline-block border px-2.5 py-1 text-[0.58rem] ${styles}`}>{children}</span>
}
