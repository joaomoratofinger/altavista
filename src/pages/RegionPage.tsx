import { Link, useParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { getRegionBySlug, getRegionCounts, regionImageUrl } from '../data/site'
import { primaryButton, ghostButton } from '../components/ui'
import NotFound from './NotFound'

export default function RegionPage() {
  const { slug = '' } = useParams()
  const { data: region, loading, error } = useAsync(() => getRegionBySlug(slug), [slug])
  const { data: counts } = useAsync(() => getRegionCounts(), [slug])

  if (loading) return <p className="mx-auto max-w-7xl px-5 pt-40 text-sm text-mute sm:px-8">Carregando…</p>
  if (error) {
    return <p className="mx-auto max-w-7xl px-5 pt-40 text-sm text-mute sm:px-8">Não foi possível carregar esta região.</p>
  }
  if (!region) return <NotFound />

  const total = region.show_count ? counts?.[region.id] : undefined
  const [cover, ...gallery] = region.images

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-36 sm:px-8 sm:pt-44">
        <p className="eyebrow text-gold-soft">Região</p>
        <h1 className="display mt-4 text-5xl text-ink sm:text-6xl">{region.name}</h1>
        {region.subtitle && <p className="mt-4 text-sm text-mute">{region.subtitle}</p>}
        {total != null && (
          <p className="eyebrow mt-6 text-gold-soft">
            {total} {total === 1 ? 'imóvel no acervo' : 'imóveis no acervo'}
          </p>
        )}
      </section>

      {cover && (
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <img
            src={regionImageUrl(cover.path)}
            alt={cover.alt ?? region.name}
            className="aspect-[16/9] w-full rounded-2xl object-cover"
          />
        </div>
      )}

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div className="whitespace-pre-line text-base leading-relaxed text-ink/80">{region.body}</div>

          <aside className="h-fit space-y-4 rounded-2xl border border-line bg-paper-soft p-6">
            <p className="eyebrow text-mute">O acervo é reservado</p>
            <p className="text-sm leading-relaxed text-ink/70">
              Os imóveis desta região não são divulgados publicamente. Cadastre-se para participar.
            </p>
            <Link to={`/comprador?regiao=${region.slug}`} className={`${primaryButton} block`}>
              Quero comprar
            </Link>
            <Link to={`/proprietario?regiao=${region.slug}`} className={`${ghostButton} block`}>
              Sou proprietário
            </Link>
          </aside>
        </div>

        {gallery.length > 0 && (
          <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((img) => (
              <img
                key={img.path}
                src={regionImageUrl(img.path)}
                alt={img.alt ?? region.name}
                loading="lazy"
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
