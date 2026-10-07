import { Link, useSearchParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { useAuth } from '../../lib/auth'
import { downloadCsv } from '../../lib/csv'
import { exportPropertiesRows, listProperties } from '../../data/admin'
import { formatDate, formatPrice } from '../../lib/format'
import { PROPERTY_STATUS_LABELS, type PropertyStatus } from '../../types/db'
import { ghostButton, Notice, StatusPill } from '../../components/ui'

const TABS: Array<{ value: PropertyStatus | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'em_analise', label: 'Em análise' },
  { value: 'ajuste_solicitado', label: 'Ajuste' },
  { value: 'no_acervo', label: 'No acervo' },
  { value: 'pausado', label: 'Pausados' },
  { value: 'vendido', label: 'Vendidos' },
  { value: 'recusado', label: 'Recusados' },
]

export function propertyTone(s: PropertyStatus): 'wait' | 'ok' | 'bad' | 'neutral' {
  if (s === 'em_analise' || s === 'ajuste_solicitado') return 'wait'
  if (s === 'no_acervo') return 'ok'
  if (s === 'recusado') return 'bad'
  return 'neutral'
}

export default function PropertyList() {
  const { isAdmin } = useAuth()
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? '') as PropertyStatus | ''
  const { data, loading, error } = useAsync(() => listProperties(status || undefined), [status])

  async function onExport() {
    const { header, rows } = await exportPropertiesRows()
    downloadCsv(`imoveis-${new Date().toISOString().slice(0, 10)}.csv`, header, rows)
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-soft">Acervo</p>
          <h1 className="display mt-2 text-4xl text-ink">Imóveis</h1>
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
        {error && <Notice tone="error">Não foi possível carregar os imóveis.</Notice>}
        {loading && <p className="text-sm text-mute">Carregando…</p>}
        {!loading && !error && data?.length === 0 && <Notice>Nenhum imóvel nesta lista.</Notice>}
      </div>

      <ul className="divide-y divide-line border-y border-line empty:hidden">
        {data?.map((p) => (
          <li key={p.id}>
            <Link to={`/painel/imoveis/${p.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-paper-soft/60">
              <div className="min-w-0 flex-1 basis-60">
                <p className="display truncate text-xl text-ink">{p.location_detail}</p>
                <p className="mt-0.5 truncate text-xs text-mute">
                  {p.region?.name} · {p.owner?.name} · {formatPrice(p.asking_price)}
                </p>
              </div>
              <span className="text-xs text-mute">{formatDate(p.created_at)}</span>
              <StatusPill tone={propertyTone(p.status)}>{PROPERTY_STATUS_LABELS[p.status]}</StatusPill>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
