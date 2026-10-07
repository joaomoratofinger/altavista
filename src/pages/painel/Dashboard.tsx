import { Link } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { getCounters } from '../../data/admin'
import { formatDate } from '../../lib/format'
import { Notice } from '../../components/ui'

export default function Dashboard() {
  const { data, loading, error } = useAsync(getCounters, [])

  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error || !data) return <Notice tone="error">Não foi possível carregar o resumo.</Notice>

  const inReview = data.properties.em_analise ?? 0
  const waiting = data.buyers.aguardando ?? 0
  const inCollection = data.properties.no_acervo ?? 0
  const approved = data.buyers.aprovado ?? 0
  const max = Math.max(1, ...data.signups.map((s) => s.proprietarios + s.compradores))

  return (
    <div className="space-y-12">
      <div>
        <p className="eyebrow text-gold-soft">Resumo</p>
        <h1 className="display mt-2 text-4xl text-ink">Painel</h1>
      </div>

      <section>
        <h2 className="eyebrow text-mute">Filas de aprovação</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <QueueCard to="/painel/imoveis?status=em_analise" label="Imóveis em análise" value={inReview} />
          <QueueCard to="/painel/compradores?status=aguardando" label="Compradores aguardando aprovação" value={waiting} />
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-mute">Acervo</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Stat label="Imóveis no acervo" value={inCollection} />
          <Stat label="Compradores aprovados" value={approved} />
        </div>
      </section>

      <section>
        <h2 className="eyebrow text-mute">Cadastros por dia (últimos 14 dias)</h2>
        <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
          {[...data.signups].reverse().map((s) => {
            const total = s.proprietarios + s.compradores
            return (
              <li key={s.day} className="flex items-center gap-4 py-2.5">
                <span className="w-20 shrink-0 text-xs text-mute">{formatDate(`${s.day}T12:00:00`)}</span>
                <span className="h-2 flex-1 bg-card">
                  <span className="block h-2 bg-gold" style={{ width: `${(total / max) * 100}%` }} />
                </span>
                <span className="w-44 shrink-0 text-right text-xs text-ink/70">
                  {s.proprietarios} proprietário{s.proprietarios === 1 ? '' : 's'} · {s.compradores} comprador{s.compradores === 1 ? '' : 'es'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function QueueCard({ to, label, value }: { to: string; label: string; value: number }) {
  return (
    <Link to={to} className="block border border-line bg-paper-soft p-6 transition-colors hover:border-gold-soft">
      <p className="display text-5xl text-ink">{value}</p>
      <p className="eyebrow mt-3 text-gold-soft">{label} →</p>
    </Link>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-line p-6">
      <p className="display text-5xl text-ink">{value}</p>
      <p className="eyebrow mt-3">{label}</p>
    </div>
  )
}
