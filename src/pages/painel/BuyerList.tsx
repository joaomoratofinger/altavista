import { Link, useSearchParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { useAuth } from '../../lib/auth'
import { downloadCsv } from '../../lib/csv'
import { exportBuyersRows, listBuyers } from '../../data/admin'
import { formatDate, formatPrice } from '../../lib/format'
import { BUYER_STATUS_LABELS, type BuyerStatus } from '../../types/db'
import { ghostButton, Notice, StatusPill } from '../../components/ui'

const TABS: Array<{ value: BuyerStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'aprovado', label: 'Aprovados' },
  { value: 'recusado', label: 'Recusados' },
]

export function buyerTone(s: BuyerStatus): 'wait' | 'ok' | 'bad' {
  return s === 'aguardando' ? 'wait' : s === 'aprovado' ? 'ok' : 'bad'
}

export default function BuyerList() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? '') as BuyerStatus | ''
  const { data, loading, error } = useAsync(() => listBuyers(status || undefined), [status])

  async function onExport() {
    const { header, rows } = await exportBuyersRows()
    downloadCsv(`compradores-${new Date().toISOString().slice(0, 10)}.csv`, header, rows)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-soft">Cadastro</p>
          <h1 className="display mt-2 text-4xl text-ink">Compradores</h1>
        </div>
        {isAdmin && (
          <button type="button" onClick={onExport} className={ghostButton}>
            Exportar planilha
          </button>
        )}
      </div>

      <div className="mt-8 flex gap-5 overflow-x-auto border-b border-line pb-3">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setParams(t.value ? { status: t.value } : {})}
            className={`eyebrow whitespace-nowrap ${status === t.value ? 'text-ink' : 'text-mute hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {error && <Notice tone="error">Não foi possível carregar os compradores.</Notice>}
        {loading && <p className="text-sm text-mute">Carregando…</p>}
        {!loading && !error && data?.length === 0 && <Notice>Nenhum comprador nesta lista.</Notice>}
      </div>

      <ul className="divide-y divide-line border-y border-line empty:hidden">
        {data?.map((b) => (
          <li key={b.id}>
            <Link to={`/painel/compradores/${b.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-paper-soft/60">
              <div className="min-w-0 flex-1 basis-60">
                <p className="display truncate text-xl text-ink">{b.name}</p>
                <p className="mt-0.5 truncate text-xs text-mute">
                  {b.kind === 'corretor' ? 'Corretor' : 'Comprador final'} · {formatPrice(b.price_min)} – {formatPrice(b.price_max)}
                </p>
              </div>
              <span className="text-xs text-mute">{formatDate(b.created_at)}</span>
              <StatusPill tone={buyerTone(b.status)}>{BUYER_STATUS_LABELS[b.status]}</StatusPill>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
