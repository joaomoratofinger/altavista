import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { formatPrice } from '../../lib/format'
import { deleteProperty, listAllProperties } from '../../data/adminProperties'
import { STATUS_LABELS, type PropertyPublic } from '../../types/property'
import { ghostButton, Notice, primaryButton } from './ui'

export default function PropertyList() {
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(listAllProperties, [reload])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function onDelete(p: PropertyPublic) {
    if (!window.confirm(`Excluir "${p.title}"? Isso apaga também as fotos e os dados do proprietário. Não dá para desfazer.`)) {
      return
    }
    setBusyId(p.id)
    setActionError(null)
    try {
      await deleteProperty(p)
      setReload((n) => n + 1)
    } catch {
      setActionError('Não foi possível excluir. Tente novamente.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-soft">Cadastro</p>
          <h1 className="display mt-2 text-4xl text-ink">Imóveis</h1>
        </div>
        <Link to="/painel/novo" className={primaryButton}>
          + Novo imóvel
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {error && (
          <Notice tone="error">
            Não foi possível carregar os imóveis. Verifique se as regras do Firestore foram
            publicadas e se esta conta está em <strong>admins</strong>.
          </Notice>
        )}
        {actionError && <Notice tone="error">{actionError}</Notice>}
        {loading && <p className="text-sm text-mute">Carregando…</p>}
        {!loading && !error && data?.length === 0 && (
          <Notice>Nenhum imóvel cadastrado ainda. Clique em “Novo imóvel” para começar.</Notice>
        )}
      </div>

      <ul className="mt-2 divide-y divide-line border-y border-line">
        {data?.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
            <div className="h-16 w-24 shrink-0 overflow-hidden bg-card">
              {p.images[0] && (
                <img src={p.images[0].url} alt="" className="h-full w-full object-cover" />
              )}
            </div>

            <div className="min-w-0 flex-1 basis-56">
              <p className="display truncate text-xl text-ink">{p.title}</p>
              <p className="mt-0.5 truncate text-xs text-mute">
                {p.location} · {formatPrice(p.price)}
              </p>
              <p className="eyebrow mt-2 flex flex-wrap gap-x-3 text-[0.6rem]">
                <span className={p.published ? 'text-gold-soft' : 'text-mute'}>
                  {p.published ? 'Publicado' : 'Rascunho'}
                </span>
                <span>{STATUS_LABELS[p.status]}</span>
                {p.featured && <span>Destaque</span>}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {p.published && (
                <Link to={`/imovel/${p.slug}`} target="_blank" className={ghostButton}>
                  Ver no site
                </Link>
              )}
              <Link to={`/painel/${p.id}`} className={ghostButton}>
                Editar
              </Link>
              <button
                type="button"
                disabled={busyId === p.id}
                onClick={() => onDelete(p)}
                className={`${ghostButton} hover:border-red-400 hover:text-red-700`}
              >
                {busyId === p.id ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
