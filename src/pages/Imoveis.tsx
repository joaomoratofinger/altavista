import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { isConfigured } from '../lib/supabase'
import { listPublicListings, listRegions } from '../data/site'
import ListingCard from '../components/ListingCard'
import type { ListingPurpose } from '../types/db'

export default function Imoveis() {
  const { data: all, loading, error } = useAsync(() => (isConfigured ? listPublicListings() : Promise.resolve([])), [])
  const { data: regions } = useAsync(() => (isConfigured ? listRegions() : Promise.resolve([])), [])
  const [purpose, setPurpose] = useState<ListingPurpose | ''>('')

  // A região fica na URL (?regiao=slug) para a home poder linkar direto para o filtro.
  const [searchParams, setSearchParams] = useSearchParams()
  const regionSlug = searchParams.get('regiao') ?? ''
  const selectedRegion = (regions ?? []).find((r) => r.slug === regionSlug) ?? null
  const regionId = selectedRegion?.id ?? ''

  function selectRegion(slug: string) {
    const next = new URLSearchParams(searchParams)
    if (slug) next.set('regiao', slug)
    else next.delete('regiao')
    setSearchParams(next, { replace: true })
  }

  // Só oferece filtro para regiões que têm imóvel publicado (e a que veio da URL, mesmo vazia).
  const usedRegions = useMemo(() => {
    const ids = new Set((all ?? []).map((l) => l.region_id))
    return (regions ?? []).filter((r) => ids.has(r.id) || r.slug === regionSlug)
  }, [all, regions, regionSlug])
  const filtered = (all ?? []).filter(
    (l) => (!regionId || l.region_id === regionId) && (!purpose || l.purpose === purpose),
  )

  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <p className="eyebrow text-gold-soft">Imóveis</p>
      <h1 className="display mt-4 text-4xl text-ink sm:text-5xl">
        {selectedRegion ? selectedRegion.name : 'Imóveis'}
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-mute">
        Seleção de imóveis para venda e aluguel. Há ainda um acervo reservado, apresentado apenas a compradores
        cadastrados.
      </p>
      {selectedRegion && (
        <Link
          to={`/regiao/${selectedRegion.slug}`}
          className="eyebrow mt-4 inline-block text-gold hover:text-gold-soft"
        >
          Conhecer a região →
        </Link>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {([['', 'Venda e aluguel'], ['venda', 'Venda'], ['aluguel', 'Aluguel']] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setPurpose(value)}
            className={`eyebrow rounded-full border px-4 py-2 transition-colors ${
              purpose === value ? 'border-ink bg-ink text-bone' : 'border-line text-mute hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(usedRegions.length > 1 || selectedRegion) && (
        <div className="mt-8 flex flex-wrap gap-2">
          {[{ id: '', slug: '', name: 'Todas' }, ...usedRegions].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => selectRegion(r.slug)}
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
        <div className="mt-10 text-sm text-mute">
          <p>
            {selectedRegion
              ? `Nenhum imóvel anunciado em ${selectedRegion.name} no momento.`
              : 'Nenhum imóvel anunciado no momento.'}
          </p>
          {selectedRegion && (
            <p className="mt-2">
              Temos também um acervo reservado.{' '}
              <Link to="/comprador" className="text-gold hover:text-gold-soft">
                Solicite acesso →
              </Link>
            </p>
          )}
        </div>
      )}

      <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </div>
  )
}
