import { useAsync } from '../../lib/useAsync'
import { listAccessLog } from '../../data/admin'
import { formatDateTime } from '../../lib/format'
import { Notice } from '../../components/ui'

export default function LogAdmin() {
  const { data, loading, error } = useAsync(() => listAccessLog(300), [])

  return (
    <>
      <p className="eyebrow text-gold-soft">Segurança</p>
      <h1 className="display mt-2 text-4xl text-ink">Log de acessos</h1>
      <p className="mt-3 max-w-xl text-xs text-mute">Últimos 300 registros: quem abriu, alterou ou exportou o quê.</p>

      <div className="mt-6 space-y-4">
        {error && <Notice tone="error">Não foi possível carregar o log.</Notice>}
        {loading && <p className="text-sm text-mute">Carregando…</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="mt-2 w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="eyebrow border-b border-line text-[0.6rem]">
              <th className="py-2 pr-4">Quando</th>
              <th className="py-2 pr-4">Quem</th>
              <th className="py-2 pr-4">Ação</th>
              <th className="py-2 pr-4">Onde</th>
              <th className="py-2">Detalhe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data?.map((r) => (
              <tr key={r.id} className="align-top">
                <td className="whitespace-nowrap py-2 pr-4 text-xs text-mute">{formatDateTime(r.at)}</td>
                <td className="py-2 pr-4">{r.user?.name ?? '—'}</td>
                <td className="py-2 pr-4">{r.action}</td>
                <td className="py-2 pr-4 text-xs text-mute">
                  {r.entity}
                  {r.entity_id && ` · ${r.entity_id.slice(0, 8)}`}
                </td>
                <td className="py-2 text-xs text-mute">{r.detail ? JSON.stringify(r.detail) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
