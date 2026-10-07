import { Link } from 'react-router-dom'
import { SITE } from '../config'

export default function Logo({
  compact = false,
  theme = 'ink',
}: {
  compact?: boolean
  theme?: 'ink' | 'bone'
}) {
  return (
    <Link to="/" className="group block leading-none" aria-label={SITE.name}>
      <span
        className={`display block text-xl tracking-[0.14em] uppercase ${
          theme === 'ink' ? 'text-ink' : 'text-bone'
        }`}
      >
        {SITE.name}
      </span>
      {!compact && (
        <span
          className={`eyebrow mt-1 block text-[0.58rem] tracking-[0.34em] ${
            theme === 'ink' ? 'text-gold-soft' : 'text-bone/80'
          }`}
        >
          {SITE.tagline}
        </span>
      )}
    </Link>
  )
}
