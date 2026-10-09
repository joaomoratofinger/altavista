import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { isConfigured } from '../lib/supabase'
import { getRegionCounts, listRegions, regionImageUrl } from '../data/site'
import { SITE, whatsappLink } from '../config'
import SectionHeading from '../components/SectionHeading'
import { MessageCircle } from 'lucide-react'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80'

export default function Home() {
  const { data: regions, loading } = useAsync(() => (isConfigured ? listRegions() : Promise.resolve([])), [])
  const { data: counts } = useAsync(
    () => (isConfigured ? getRegionCounts() : Promise.resolve<Record<string, number>>({})),
    [],
  )

  return (
    <>
      <section className="relative min-h-[78vh] w-full overflow-hidden">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/35 to-ink/25" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col items-center justify-center px-5 pb-16 pt-32 text-center sm:px-8">
          <p className="eyebrow text-bone/80">
            {SITE.name} · {SITE.tagline}
          </p>
          <h1 className="display mt-6 max-w-3xl text-5xl text-bone sm:text-6xl lg:text-7xl">
            Off-Market.
            <span className="mt-1 block italic text-bone/60">Homes</span>
          </h1>
          <p className="eyebrow mt-6 max-w-2xl leading-relaxed tracking-[0.2em] text-bone/75">
            Casas de alto padrão fora do mercado
          </p>

          <div className="mt-10 flex w-full max-w-2xl flex-col gap-2 rounded-3xl bg-paper p-2 shadow-xl sm:flex-row sm:items-center sm:rounded-full">
            <Link
              to="/comprador"
              className="eyebrow flex-1 rounded-full px-6 py-4 text-ink transition-colors hover:bg-paper-soft"
            >
              Quero comprar
            </Link>
            <span className="hidden h-6 w-px bg-line sm:block" />
            <Link
              to="/proprietario"
              className="eyebrow flex-1 rounded-full px-6 py-4 text-ink transition-colors hover:bg-paper-soft"
            >
              Sou proprietário
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="eyebrow flex items-center justify-center gap-2 rounded-full bg-gold px-7 py-4 text-ink transition-colors hover:bg-gold-soft hover:text-bone"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <SectionHeading title="Regiões" />
        {loading && <p className="mt-10 text-sm text-mute">Carregando…</p>}
        {!isConfigured && (
          <p className="mt-10 text-sm text-mute">As regiões aparecem aqui quando o banco de dados estiver configurado.</p>
        )}
        <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {regions?.map((r) => {
            const total = counts?.[r.id]
            return (
              <Link
                key={r.id}
                to={`/regiao/${r.slug}`}
                className="group block w-[72%] shrink-0 snap-start sm:w-[44%] lg:w-auto"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-card">
                  {r.images[0] && (
                    <img
                      src={regionImageUrl(r.images[0].path)}
                      alt={r.images[0].alt ?? r.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    />
                  )}
                </div>
                <h3 className="display mt-4 text-2xl text-ink">{r.name}</h3>
                {r.subtitle && <p className="mt-1 text-xs text-mute">{r.subtitle}</p>}
                {total != null && (
                  <p className="eyebrow mt-2 text-[0.6rem] text-gold-soft">
                    {total} {total === 1 ? 'imóvel no acervo' : 'imóveis no acervo'}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-line bg-paper-soft p-8 sm:p-10">
            <p className="eyebrow text-gold-soft">Para proprietários</p>
            <h2 className="display mt-4 text-3xl text-ink sm:text-4xl">
              Sua casa apresentada só a quem importa.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink/70">
              Cadastre o imóvel com sigilo. Nossa equipe analisa e, uma vez aprovado, ele passa a
              integrar o acervo e é mostrado apenas a compradores selecionados — sem anúncio público.
            </p>
            <Link to="/proprietario" className="eyebrow mt-6 inline-block text-gold hover:text-gold-soft">
              Cadastrar meu imóvel →
            </Link>
          </div>
          <div className="rounded-3xl border border-line bg-paper-soft p-8 sm:p-10">
            <p className="eyebrow text-gold-soft">Para compradores</p>
            <h2 className="display mt-4 text-3xl text-ink sm:text-4xl">
              Acesso reservado, atendimento pelo WhatsApp.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-ink/70">
              Faça seu cadastro e, após aprovação, receba pelo WhatsApp as opções compatíveis com
              seu perfil, com fotos e detalhes do acervo.
            </p>
            <Link to="/comprador" className="eyebrow mt-6 inline-block text-gold hover:text-gold-soft">
              Solicitar acesso →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
