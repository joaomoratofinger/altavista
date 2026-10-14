import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { getListingBySlug, listingImageUrl } from '../data/site'
import { formatArea } from '../lib/format'
import { whatsappLink } from '../config'
import { LISTING_PURPOSE_LABELS, LISTING_STATUS_LABELS } from '../types/db'
import { listingPriceLabel } from '../components/ListingCard'
import { primaryButton, ghostButton } from '../components/ui'
import NotFound from './NotFound'

export default function ImovelDetail() {
  const { slug = '' } = useParams()
  const { data: listing, loading, error } = useAsync(() => getListingBySlug(slug), [slug])
  const [active, setActive] = useState(0)

  if (loading) return <p className="mx-auto max-w-7xl px-5 pt-40 text-sm text-mute sm:px-8">Carregando…</p>
  if (error) {
    return <p className="mx-auto max-w-7xl px-5 pt-40 text-sm text-mute sm:px-8">Não foi possível carregar este imóvel.</p>
  }
  if (!listing) return <NotFound />

  const current = listing.images[active] ?? listing.images[0]
  const specs: Array<[string, string | null]> = [
    ['Área construída', listing.built_area_m2 != null ? formatArea(listing.built_area_m2) : null],
    ['Terreno', listing.land_area_m2 != null ? formatArea(listing.land_area_m2) : null],
    ['Dormitórios', listing.bedrooms != null ? String(listing.bedrooms) : null],
    ['Suítes', listing.suites != null ? String(listing.suites) : null],
    ['Vagas', listing.parking != null ? String(listing.parking) : null],
    ['Finalidade', LISTING_PURPOSE_LABELS[listing.purpose]],
    ['Situação', LISTING_STATUS_LABELS[listing.status]],
  ]
  const message = `Olá, tenho interesse no imóvel "${listing.title}" (${listing.location}). Podemos conversar?`

  return (
    <article className="pt-32 sm:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link to="/imoveis" className="eyebrow text-mute hover:text-ink">← Imóveis</Link>
      </div>

      {current && (
        <div className="mx-auto mt-6 max-w-7xl px-5 sm:px-8">
          <img
            src={listingImageUrl(current.path)}
            alt={current.alt ?? listing.title}
            className="aspect-[16/10] w-full rounded-2xl object-cover"
          />
          {listing.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                <button
                  key={img.path}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`h-20 w-28 shrink-0 overflow-hidden rounded-lg border transition-opacity ${
                    i === active ? 'border-gold opacity-100' : 'border-line opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={listingImageUrl(img.path)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mx-auto mt-14 grid max-w-7xl gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow text-gold-soft">{listing.location}</p>
          <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">{listing.title}</h1>

          {listing.description && (
            <p className="mt-8 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-ink/75">{listing.description}</p>
          )}

          {listing.highlights.length > 0 && (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {listing.highlights.map((h) => (
                <li key={h} className="border-l border-gold-soft/50 pl-4 text-sm text-ink/80">{h}</li>
              ))}
            </ul>
          )}

          <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line pt-8 sm:grid-cols-3">
            {specs
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="eyebrow text-mute">{k}</dt>
                  <dd className="mt-1 text-sm text-ink">{v}</dd>
                </div>
              ))}
          </dl>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-line bg-paper-soft p-7 lg:sticky lg:top-28">
          <p className="eyebrow text-mute">{listing.purpose === 'aluguel' ? 'Aluguel' : 'Valor'}</p>
          <p className="display text-3xl text-gold">{listingPriceLabel(listing)}</p>
          <p className="text-sm leading-relaxed text-mute">
            Visitas e documentação são agendadas com a nossa equipe.
          </p>
          <a href={whatsappLink(message)} target="_blank" rel="noreferrer" className={`${primaryButton} block`}>
            Tenho interesse
          </a>
          <Link to="/comprador" className={`${ghostButton} block`}>
            Acessar o acervo reservado
          </Link>
        </aside>
      </div>
    </article>
  )
}
