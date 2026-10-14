import { Link } from 'react-router-dom'
import { listingImageUrl } from '../data/site'
import { formatNumber, formatPrice } from '../lib/format'
import { LISTING_STATUS_LABELS, type Listing } from '../types/db'

export function listingSpecLine(l: Listing): string {
  return [
    l.built_area_m2 != null && `${formatNumber(l.built_area_m2)} m² construídos`,
    l.suites != null && `${l.suites} suítes`,
    l.parking != null && `${l.parking} vagas`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export default function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0]
  return (
    <Link to={`/imovel/${listing.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-card">
        {cover && (
          <img
            src={listingImageUrl(cover.path)}
            alt={cover.alt ?? listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        )}
        {listing.status !== 'disponivel' && (
          <span className="eyebrow absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1.5 text-[0.6rem] text-bone backdrop-blur">
            {LISTING_STATUS_LABELS[listing.status]}
          </span>
        )}
      </div>
      <div className="pt-4">
        <h3 className="display text-2xl text-ink">{listing.title}</h3>
        <p className="eyebrow mt-2 text-mute">{listing.location}</p>
        <p className="mt-3 text-sm text-ink/70">{listingSpecLine(listing)}</p>
        <p className="mt-3 text-sm tracking-wide text-gold">
          {listing.price == null ? 'Sob consulta' : formatPrice(listing.price)}
        </p>
      </div>
    </Link>
  )
}
