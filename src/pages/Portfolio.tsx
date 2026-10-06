import { useMemo, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { listProperties } from '../data/properties'
import PropertyCard from '../components/PropertyCard'
import SectionHeading from '../components/SectionHeading'
import PageHeader from '../components/PageHeader'

export default function Portfolio() {
  const { data: all, loading } = useAsync(listProperties, [])
  const [region, setRegion] = useState<string>('todas')

  const regions = useMemo(() => {
    const set = new Set((all ?? []).map((p) => p.region))
    return ['todas', ...[...set].sort()]
  }, [all])

  const filtered = useMemo(
    () => (all ?? []).filter((p) => region === 'todas' || p.region === region),
    [all, region],
  )

  return (
    <>
      <PageHeader
        eyebrow="Portfólio"
        title="Propriedades sob assessoria"
        subtitle="Fazendas, haras e casas de campo verificadas uma a uma. Alguns imóveis não aparecem aqui — fale conosco sobre a lista off market."
      />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <SectionHeading
          title="Todas as propriedades"
          aside={!loading ? `${filtered.length} de ${all?.length ?? 0}` : undefined}
        />

        <div className="mt-6 flex flex-wrap gap-2">
          {regions.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegion(r)}
              className={`eyebrow border px-4 py-2 transition-colors ${
                region === r
                  ? 'border-gold bg-gold text-ink'
                  : 'border-line text-mute hover:border-ink/30 hover:text-ink'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {loading && <p className="mt-10 text-sm text-mute">Carregando…</p>}

        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="mt-12 text-sm text-mute">
            Nenhuma propriedade nesta região no momento.
          </p>
        )}
      </section>
    </>
  )
}
