import { useMemo, useState } from 'react'
import { useAsync } from '../lib/useAsync'
import { isConfigured } from '../lib/supabase'
import { listPublicListings, listRegions } from '../data/site'
import ListingCard from '../components/ListingCard'

export default function Imoveis() {
  const { data: all, loading, error } = useAsync(() => (isConfigured ? listPublicListings() : Promise.resolve([])), [])
  const { data: regions } = useAsync(() => (isConfigured ? listRegions() : Promise.resolve([])), [])
  const [regionId, setRegionId] = useState('')

  // Só oferece filtro para regiões que têm imóvel publicado.
  const usedRegions = useMemo(() => {
    const ids = new Set((all ?? []).map((l) => l.region_id))
    return (regions ?? []).filter((r) => ids.has(r.id))
  }, [all, regions])
  const filtered = (all ?? []).filter((l) => !regionId || l.region_id === regionId)

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <p className="eyebrow text-gold-soft">Imóveis</p>
      <h1 className="display mt-4 text-4xl text-ink sm:text-5xl">Imóveis à venda</h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-mute">
        Seleção de imóveis anunciados. Há ainda um acervo reservado, apresentado apenas a compradores
        cadastrados.
      </p>

      {usedRegions.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {[{ id: '', name: 'Todas' }, ...usedRegions].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRegionId(r.id)}
              className={`eyebrow rounded-full border px-4 py-2 transition-colors ${
                regionId === r.id ? 'border-gold bg-gold text-ink' : 'border-line text-mute hover:text-ink'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="mt-10 text-sm text-mute">Carregando…</p>}
      {error && <p className="mt-10 text-sm text-mute">Não foi possível carregar os imóveis.</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="mt-10 text-sm text-mute">Nenhum imóvel anunciado no momento.</p>
      )}

      <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  )
}
