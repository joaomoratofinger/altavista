import type { PropertyStatus } from '../types/property'
import { STATUS_LABELS } from '../types/property'

export default function StatusBadge({ status }: { status: PropertyStatus }) {
  if (status === 'disponivel') return null
  return (
    <span className="eyebrow bg-ink/80 px-3 py-1.5 text-[0.6rem] tracking-[0.22em] text-bone backdrop-blur">
      {STATUS_LABELS[status]}
    </span>
  )
}
