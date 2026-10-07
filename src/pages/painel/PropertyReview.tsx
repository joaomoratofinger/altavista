import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { useAuth } from '../../lib/auth'
import {
  compatibleBuyers,
  deleteOwner,
  deleteProperty,
  getProperty,
  logAccess,
  setPropertyStatus,
  signedMediaUrls,
} from '../../data/admin'
import { formatArea, formatDate, formatDateTime, formatNumber, formatPhone, formatPrice } from '../../lib/format'
import { PROPERTY_STATUS_LABELS, type PropertyStatus } from '../../types/db'
import { dangerButton, Field, ghostButton, inputClass, Notice, primaryButton, StatusPill } from '../../components/ui'
import { propertyTone } from './PropertyList'

export default function PropertyReview() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [reload, setReload] = useState(0)

  const { data, loading, error } = useAsync(async () => {
    const res = await getProperty(id)
    if (!res) return null
    const urls = await signedMediaUrls(res.media.map((m) => m.path))
    if (res.media.length) logAccess('ver_midia', 'properties', id, { arquivos: res.media.length })
    return { ...res, urls }
  }, [id, reload])
  const { data: buyers } = useAsync(
    () => (data?.property.status === 'no_acervo' ? compatibleBuyers(id) : Promise.resolve([])),
    [id, data?.property.status],
  )

  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar o imóvel.</Notice>
  if (!data) {
    return (
      <div className="space-y-4">
        <Notice>Imóvel não encontrado.</Notice>
        <Link to="/painel/imoveis" className="eyebrow text-gold">← Voltar</Link>
      </div>
    )
  }

  const { property: p, media, urls } = data
  const photos = media.filter((m) => m.kind === 'foto')
  const others = media.filter((m) => m.kind !== 'foto')

  async function change(status: PropertyStatus, needsNote = false) {
    if (needsNote && !note.trim()) {
      setActionError('Escreva um motivo/orientação para o proprietário.')
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      await setPropertyStatus(id, status, note)
      setNote('')
      setReload((n) => n + 1)
    } catch {
      setActionError('Não foi possível atualizar o status.')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!window.confirm('Excluir este imóvel e suas fotos? Não dá para desfazer.')) return
    setBusy(true)
    try {
      await deleteProperty(id, media)
      navigate('/painel/imoveis')
    } catch {
      setActionError('Não foi possível excluir.')
      setBusy(false)
    }
  }

  async function onDeleteOwner() {
    if (!p.owner) return
    if (!window.confirm(`Apagar ${p.owner.name} e TODOS os imóveis e arquivos dele(a)? (pedido de exclusão LGPD) Não dá para desfazer.`)) return
    setBusy(true)
    try {
      await deleteOwner(p.owner.id)
      navigate('/painel/imoveis')
    } catch {
      setActionError('Não foi possível excluir o proprietário.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <Link to="/painel/imoveis" className="eyebrow text-mute hover:text-ink">← Imóveis</Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="display text-4xl text-ink">{p.location_detail}</h1>
          <StatusPill tone={propertyTone(p.status)}>{PROPERTY_STATUS_LABELS[p.status]}</StatusPill>
        </div>
        <p className="mt-2 text-xs text-mute">
          {p.region?.name} · cadastrado em {formatDateTime(p.created_at)}
          {p.reviewed_at && ` · última decisão em ${formatDateTime(p.reviewed_at)}`}
        </p>
      </div>

      <section className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="Terreno" value={formatArea(p.land_area_m2)} />
        <Info label="Área construída" value={formatArea(p.built_area_m2)} />
        <Info label="Valor pretendido" value={formatPrice(p.asking_price)} />
        <Info label="Quartos" value={formatNumber(p.bedrooms)} />
        <Info label="Suítes" value={formatNumber(p.suites)} />
        <Info label="Vagas" value={formatNumber(p.parking)} />
        <Info label="Aceita contato de compradores" value={p.accepts_buyer_contact ? 'Sim' : 'Não'} />
        <Info label="Diferenciais" value={p.highlights ?? '—'} wide />
      </section>

      <section className="border border-gold-soft/40 bg-paper-soft p-6">
        <p className="eyebrow text-gold-soft">Proprietário — uso interno</p>
        {p.owner && (
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <Info label="Nome" value={p.owner.name} />
            <Info
              label="WhatsApp"
              value={
                <a className="underline" href={`https://wa.me/${p.owner.whatsapp}`} target="_blank" rel="noreferrer">
                  {formatPhone(p.owner.whatsapp)}
                </a>
              }
            />
            <Info label="E-mail" value={p.owner.email} />
            <Info
              label="Aceite do termo"
              value={`v${p.owner.terms_version} em ${formatDate(p.owner.terms_accepted_at)}`}
            />
          </div>
        )}
      </section>

      <section>
        <h2 className="display text-2xl text-ink">Arquivos</h2>
        <p className="mt-1 text-xs text-mute">Links temporários (1 hora). Recarregue a página para renovar.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((m) =>
            urls[m.path] ? (
              <a key={m.id} href={urls[m.path]} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden bg-card">
                <img src={urls[m.path]} alt="" loading="lazy" className="h-full w-full object-cover" />
              </a>
            ) : null,
          )}
        </div>
        {others.length > 0 && (
          <ul className="mt-6 space-y-2 text-sm">
            {others.map((m) => (
              <li key={m.id}>
                {urls[m.path] ? (
                  <a className="underline" href={urls[m.path]} target="_blank" rel="noreferrer">
                    {m.kind === 'planta' ? 'Planta' : 'Vídeo'}
                  </a>
                ) : (
                  m.kind
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <h2 className="display text-2xl text-ink">Decisão</h2>
        {p.review_note && <Notice>Última observação: {p.review_note}</Notice>}
        {actionError && <Notice tone="error">{actionError}</Notice>}
        <Field label="Observação" hint="Obrigatória para pedir ajuste ou recusar. Fica registrada no cadastro.">
          <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3">
          {p.status !== 'no_acervo' && (
            <button type="button" disabled={busy} className={primaryButton} onClick={() => change('no_acervo')}>
              Aprovar → No acervo
            </button>
          )}
          {p.status !== 'ajuste_solicitado' && (
            <button type="button" disabled={busy} className={ghostButton} onClick={() => change('ajuste_solicitado', true)}>
              Pedir ajuste
            </button>
          )}
          {p.status !== 'recusado' && (
            <button type="button" disabled={busy} className={dangerButton} onClick={() => change('recusado', true)}>
              Recusar
            </button>
          )}
          {p.status === 'no_acervo' && (
            <>
              <button type="button" disabled={busy} className={ghostButton} onClick={() => change('pausado')}>
                Pausar
              </button>
              <button type="button" disabled={busy} className={ghostButton} onClick={() => change('vendido')}>
                Marcar como vendido
              </button>
            </>
          )}
        </div>
      </section>

      {p.status === 'no_acervo' && (
        <section>
          <h2 className="display text-2xl text-ink">Compradores compatíveis</h2>
          <p className="mt-1 text-xs text-mute">Aprovados, com a região do imóvel e faixa de valor compatível.</p>
          {buyers?.length === 0 && <p className="mt-4 text-sm text-mute">Nenhum comprador compatível no momento.</p>}
          <ul className="mt-4 divide-y divide-line border-y border-line empty:hidden">
            {buyers?.map((b) => (
              <li key={b.id}>
                <Link to={`/painel/compradores/${b.id}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm hover:bg-paper-soft/60">
                  <span className="text-ink">{b.name}</span>
                  <span className="text-xs text-mute">
                    {b.kind === 'corretor' ? 'Corretor' : 'Comprador final'} · {formatPrice(b.price_min)} – {formatPrice(b.price_max)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {isAdmin && (
        <section className="flex flex-wrap gap-3 border-t border-line pt-8">
          <button type="button" disabled={busy} className={dangerButton} onClick={onDelete}>
            Excluir imóvel
          </button>
          <button type="button" disabled={busy} className={dangerButton} onClick={onDeleteOwner}>
            Excluir proprietário e todos os dados (LGPD)
          </button>
        </section>
      )}
    </div>
  )
}

function Info({ label, value, wide }: { label: string; value: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2 lg:col-span-3' : ''}>
      <p className="eyebrow text-[0.6rem]">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-ink">{value}</p>
    </div>
  )
}
