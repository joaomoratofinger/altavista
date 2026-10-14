import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/useAsync'
import { getMyAcervo } from '../data/site'
import { formatPrice } from '../lib/format'
import { ghostButton, Notice } from '../components/ui'

/** Imóveis compatíveis com o perfil do comprador aprovado. Sem endereço, proprietário ou fotos. */
export default function Acervo() {
  const { session, loading: authLoading, signOut } = useAuth()

  // Conteúdo reservado: não deve aparecer em buscadores.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const { data, loading, error } = useAsync(
    () => (session ? getMyAcervo() : Promise.resolve(null)),
    [session?.user.id],
  )

  if (authLoading) return <p className="mx-auto max-w-5xl px-5 pt-40 text-sm text-mute sm:px-8">Carregando…</p>
  if (!session) return <Navigate to="/entrar" replace />

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-soft">Acervo reservado</p>
          <h1 className="display mt-4 text-4xl text-ink sm:text-5xl">
            {data ? `Olá, ${data.name.split(' ')[0]}` : 'Seu acervo'}
          </h1>
        </div>
        <button type="button" onClick={signOut} className={ghostButton}>
          Sair
        </button>
      </div>

      <div className="mt-10 space-y-6">
        {loading && <p className="text-sm text-mute">Carregando…</p>}
        {error && <Notice tone="error">Não foi possível carregar o acervo. Tente novamente em instantes.</Notice>}
        {!loading && !error && !data && (
          <Notice>Seu acesso não está ativo. Fale com a nossa equipe.</Notice>
        )}
        {data && data.properties.length === 0 && (
          <Notice>
            Nenhum imóvel do acervo corresponde ao seu perfil neste momento. Avisaremos assim que surgir
            uma oportunidade.
          </Notice>
        )}

        <ul className="grid gap-6 sm:grid-cols-2">
          {data?.properties.map((p) => (
            <li key={p.id} className="space-y-3 rounded-2xl border border-line bg-paper-soft p-6">
              <p className="eyebrow text-gold-soft">{p.region}</p>
              <p className="display text-2xl text-ink">{formatPrice(p.asking_price)}</p>
              <p className="text-sm text-mute">
                {[
                  p.land_area_m2 != null && `Terreno ${p.land_area_m2} m²`,
                  p.built_area_m2 != null && `Construída ${p.built_area_m2} m²`,
                  p.bedrooms != null && `${p.bedrooms} quartos`,
                  p.suites != null && `${p.suites} suítes`,
                  p.parking != null && `${p.parking} vagas`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {p.highlights && <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{p.highlights}</p>}
            </li>
          ))}
        </ul>

        {data && (
          <p className="text-xs text-mute">
            Endereço e fotos são apresentados pela nossa equipe a quem demonstrar interesse.
          </p>
        )}
      </div>
    </div>
  )
}
