import { Link } from 'react-router-dom'
import type { PropertyPublic } from '../types/property'
import { formatPrice, specLine } from '../lib/format'
import StatusBadge from './StatusBadge'

export default function PropertyCard({ property }: { property: PropertyPublic }) {
  const cover = property.images[0]
  return (
    <Link to={`/imovel/${property.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-card">
        {cover && (
          <img
            src={cover.url}
            alt={cover.alt ?? property.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={property.status} />
        </div>
      </div>

      <div className="pt-5">
        <h3 className="display text-2xl text-ink">{property.title}</h3>
        <p className="eyebrow mt-2 text-mute">{property.location}</p>
        <p className="mt-3 text-sm text-ink/70">{specLine(property)}</p>
        <p className="mt-4 text-sm tracking-wide text-gold">{formatPrice(property.price)}</p>
      </div>
    </Link>
  )
}
