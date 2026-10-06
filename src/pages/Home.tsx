import { Link } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { listFeatured } from '../data/properties'
import { SITE, whatsappLink } from '../config'
import PropertyCard from '../components/PropertyCard'
import SectionHeading from '../components/SectionHeading'
import AboutElizeu from '../components/AboutElizeu'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80'

export default function Home() {
  const { data: featured, loading } = useAsync(listFeatured, [])

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[92vh] w-full overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Casa de campo ao entardecer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/45 to-ink/10" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col justify-end px-5 pb-16 pt-32 sm:px-8">
          <p className="eyebrow text-bone/70">Porto Feliz · São Paulo · Portugal</p>
          <h1 className="display mt-6 max-w-3xl text-5xl text-bone sm:text-6xl lg:text-7xl">
            Casas de campo para quem já sabe o que quer.
          </h1>
          <div className="mt-8 flex flex-col gap-2 text-sm text-bone/70 sm:flex-row sm:gap-8">
            <span>O maior portfólio em Porto Feliz — SP</span>
            <span className="hidden sm:inline text-line">|</span>
            <span>Imóveis off market, fora do mercado</span>
            <span className="hidden sm:inline text-line">|</span>
            <span>Assessoria Brasil e Portugal</span>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/portfolio"
              className="eyebrow border border-bone/30 px-7 py-3.5 text-bone transition-colors hover:border-gold hover:text-gold"
            >
              Ver portfólio
            </Link>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="eyebrow bg-gold px-7 py-3.5 text-ink transition-colors hover:bg-gold-soft"
            >
              Falar com {SITE.name.split(' ')[0]}
            </a>
          </div>
        </div>
      </section>

      {/* SELEÇÃO ATUAL */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading
          title="Seleção atual"
          aside={featured ? `${featured.length} propriedades` : undefined}
        />

        {loading && <p className="mt-10 text-sm text-mute">Carregando…</p>}

        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured?.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>

        <div className="mt-14 border-t border-line pt-8">
          <Link to="/portfolio" className="eyebrow text-gold hover:text-gold-soft">
            Ver todas as propriedades →
          </Link>
        </div>
      </section>

      {/* SOBRE ELIZEU */}
      <AboutElizeu />

      {/* FAIXA OFF MARKET */}
      <section className="border-y border-line bg-paper-soft">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="eyebrow text-gold-soft">Off Market</p>
            <h2 className="display mt-4 text-3xl text-ink sm:text-4xl">
              As melhores propriedades nunca chegam a ser anunciadas.
            </h2>
          </div>
          <div className="text-sm leading-relaxed text-ink/70">
            <p>
              Boa parte do que assessoramos é negociada em silêncio, direto entre
              proprietário e comprador. Cadastramos seu perfil e avisamos quando algo
              compatível entra no portfólio — antes de ir ao mercado.
            </p>
            <Link
              to="/off-market"
              className="eyebrow mt-6 inline-block text-gold hover:text-gold-soft"
            >
              Entrar na lista off market →
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
