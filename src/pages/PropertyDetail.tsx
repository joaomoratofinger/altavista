import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { getPropertyBySlug } from '../data/properties'
import { formatPrice, formatArea } from '../lib/format'
import { STATUS_LABELS } from '../types/property'
import { whatsappLink } from '../config'

export default function PropertyDetail() {
  const { slug = '' } = useParams()
  const { data: property, loading } = useAsync(() => getPropertyBySlug(slug), [slug])
  const [active, setActive] = useState(0)

  if (loading) {
    return <div className="mx-auto max-w-7xl px-5 pt-44 text-sm text-mute sm:px-8">Carregando…</div>
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-7xl px-5 pt-44 sm:px-8">
        <p className="eyebrow text-gold-soft">404</p>
        <h1 className="display mt-4 text-3xl text-ink">Imóvel não encontrado</h1>
        <Link to="/portfolio" className="eyebrow mt-6 inline-block text-gold">
          ← Voltar ao portfólio
        </Link>
      </div>
    )
  }

  const cover = property.images[active] ?? property.images[0]
  const specs: Array<[string, string | null]> = [
    ['Área construída', formatArea(property.builtAreaM2)],
    ['Terreno', property.landAlqueires ? `${property.landAlqueires} alqueires` : formatArea(property.landAreaM2)],
    ['Suítes', property.suites ? String(property.suites) : null],
    ['Dormitórios', property.bedrooms ? String(property.bedrooms) : null],
    ['Vagas', property.parking ? String(property.parking) : null],
    ['Situação', STATUS_LABELS[property.status]],
  ]

  const waMsg = `Olá, tenho interesse na propriedade "${property.title}" (${property.location}). Podemos conversar?`

  return (
    <article className="pt-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Link to="/portfolio" className="eyebrow text-mute hover:text-ink">
          ← Portfólio
        </Link>
      </div>

      {/* Galeria */}
      <div className="mx-auto mt-6 max-w-7xl px-5 sm:px-8">
        <div className="aspect-[16/10] overflow-hidden bg-card">
          {cover && (
            <img src={cover.url} alt={cover.alt ?? property.title} className="h-full w-full object-cover" />
          )}
        </div>
        {property.images.length > 1 && (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {property.images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setActive(i)}
                className={`h-20 w-28 shrink-0 overflow-hidden border transition-opacity ${
                  i === active ? 'border-gold opacity-100' : 'border-line opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="mx-auto mt-14 grid max-w-7xl gap-12 px-5 pb-24 sm:px-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow text-gold-soft">{property.location}</p>
          <h1 className="display mt-3 text-4xl text-ink sm:text-5xl">{property.title}</h1>

          {property.description && (
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-ink/75">
              {property.description}
            </p>
          )}

          {property.highlights && property.highlights.length > 0 && (
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {property.highlights.map((h) => (
                <li key={h} className="border-l border-gold-soft/50 pl-4 text-sm text-ink/80">
                  {h}
                </li>
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

        {/* Card de contato — sem qualquer dado do proprietário */}
        <aside className="h-fit border border-line bg-paper-soft p-7 lg:sticky lg:top-28">
          <p className="eyebrow text-mute">Valor</p>
          <p className="display mt-2 text-3xl text-gold">{formatPrice(property.price)}</p>
          <p className="mt-6 text-sm leading-relaxed text-mute">
            Documentação e visitas agendadas com a assessoria. Fale com a gente para
            receber o dossiê completo desta propriedade.
          </p>
          <a
            href={whatsappLink(waMsg)}
            target="_blank"
            rel="noreferrer"
            className="eyebrow mt-6 block bg-gold px-6 py-4 text-center text-ink transition-colors hover:bg-gold-soft"
          >
            Tenho interesse
          </a>
          <Link
            to="/off-market"
            className="eyebrow mt-3 block border border-line px-6 py-4 text-center text-ink transition-colors hover:border-gold-soft"
          >
            Entrar na lista off market
          </Link>
        </aside>
      </div>
    </article>
  )
}
