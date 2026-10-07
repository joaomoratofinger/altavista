import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { useAuth } from '../../lib/auth'
import {
  addTeamNote,
  compatibleProperties,
  deleteBuyer,
  getBuyer,
  listAllRegions,
  listInteractions,
  setBuyerStatus,
} from '../../data/admin'
import { formatCpf, formatDate, formatDateTime, formatPhone, formatPrice } from '../../lib/format'
import { BUYER_STATUS_LABELS, type BuyerStatus } from '../../types/db'
import { dangerButton, Field, ghostButton, inputClass, Notice, primaryButton, StatusPill } from '../../components/ui'
import { buyerTone } from './BuyerList'

export default function BuyerReview() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [reload, setReload] = useState(0)

  const { data: buyer, loading, error } = useAsync(() => getBuyer(id), [id, reload])
  const { data: regions } = useAsync(listAllRegions, [])
  const { data: history } = useAsync(() => listInteractions(id), [id, reload])
  const { data: matches } = useAsync(
    () => (buyer?.status === 'aprovado' ? compatibleProperties(id) : Promise.resolve([])),
    [id, buyer?.status],
  )

  const [note, setNote] = useState('')
  const [teamNote, setTeamNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar o comprador.</Notice>
  if (!buyer) {
    return (
      <div className="space-y-4">
        <Notice>Comprador não encontrado.</Notice>
        <Link to="/painel/compradores" className="eyebrow text-gold">← Voltar</Link>
      </div>
    )
  }

  const regionNames = new Map(regions?.map((r) => [r.id, r.name]))

  async function change(status: BuyerStatus, needsNote = false) {
    if (needsNote && !note.trim()) {
      setActionError('Escreva o motivo da recusa.')
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      await setBuyerStatus(id, status, note)
      setNote('')
      setReload((n) => n + 1)
    } catch {
      setActionError('Não foi possível atualizar o status.')
    } finally {
      setBusy(false)
    }
  }

  async function onAddNote() {
    if (!teamNote.trim()) return
    setBusy(true)
    try {
      await addTeamNote(id, teamNote.trim())
      setTeamNote('')
      setReload((n) => n + 1)
    } catch {
      setActionError('Não foi possível salvar a anotação.')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(`Apagar ${buyer!.name} e todo o histórico? (pedido de exclusão LGPD) Não dá para desfazer.`)) return
    setBusy(true)
    try {
      await deleteBuyer(id)
      navigate('/painel/compradores')
    } catch {
      setActionError('Não foi possível excluir.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-12">
      <div>
        <Link to="/painel/compradores" className="eyebrow text-mute hover:text-ink">← Compradores</Link>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="display text-4xl text-ink">{buyer.name}</h1>
          <StatusPill tone={buyerTone(buyer.status)}>{BUYER_STATUS_LABELS[buyer.status]}</StatusPill>
        </div>
        <p className="mt-2 text-xs text-mute">
          Cadastro em {formatDateTime(buyer.created_at)}
          {buyer.reviewed_at && ` · última decisão em ${formatDateTime(buyer.reviewed_at)}`}
        </p>
      </div>

      <section className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <Info label="CPF" value={formatCpf(buyer.cpf)} />
        <Info
          label="WhatsApp"
          value={
            <a className="underline" href={`https://wa.me/${buyer.whatsapp}`} target="_blank" rel="noreferrer">
              {formatPhone(buyer.whatsapp)}
            </a>
          }
        />
        <Info label="E-mail" value={buyer.email} />
        <Info label="Tipo" value={buyer.kind === 'corretor' ? 'Corretor' : 'Comprador final'} />
        <Info label="Faixa de valor" value={`${formatPrice(buyer.price_min)} – ${formatPrice(buyer.price_max)}`} />
        <Info label="Regiões" value={buyer.region_ids.map((r) => regionNames.get(r) ?? '…').join(', ')} />
        <Info label="Perfil do imóvel" value={buyer.property_profile ?? '—'} wide />
        <Info label="Aceite do termo" value={`v${buyer.terms_version} em ${formatDate(buyer.terms_accepted_at)}`} />
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <h2 className="display text-2xl text-ink">Decisão</h2>
        {buyer.review_note && <Notice>Última observação: {buyer.review_note}</Notice>}
        {actionError && <Notice tone="error">{actionError}</Notice>}
        <Field label="Observação" hint="Obrigatória para recusar.">
          <textarea className={inputClass} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-3">
          {buyer.status !== 'aprovado' && (
            <button type="button" disabled={busy} className={primaryButton} onClick={() => change('aprovado')}>
              Aprovar
            </button>
          )}
          {buyer.status !== 'recusado' && (
            <button type="button" disabled={busy} className={dangerButton} onClick={() => change('recusado', true)}>
              Recusar
            </button>
          )}
          {buyer.status !== 'aguardando' && (
            <button type="button" disabled={busy} className={ghostButton} onClick={() => change('aguardando')}>
              Voltar para a fila
            </button>
          )}
        </div>
      </section>

      {buyer.status === 'aprovado' && (
        <section>
          <h2 className="display text-2xl text-ink">Imóveis compatíveis</h2>
          {matches?.length === 0 && <p className="mt-4 text-sm text-mute">Nenhum imóvel compatível no acervo.</p>}
          <ul className="mt-4 divide-y divide-line border-y border-line empty:hidden">
            {matches?.map((p) => (
              <li key={p.id}>
                <Link to={`/painel/imoveis/${p.id}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm hover:bg-paper-soft/60">
                  <span className="text-ink">{p.location_detail}</span>
                  <span className="text-xs text-mute">{formatPrice(p.asking_price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="display text-2xl text-ink">Histórico</h2>
        <p className="mt-1 text-xs text-mute">Conversas e fotos enviadas a este comprador.</p>
        {history?.length === 0 && <p className="mt-4 text-sm text-mute">Sem interações ainda.</p>}
        <ul className="mt-4 space-y-3">
          {history?.map((h) => (
            <li key={h.id} className="border border-line p-4 text-sm">
              <p className="eyebrow text-[0.6rem] text-gold-soft">
                {h.direction === 'comprador' ? 'Comprador' : h.direction === 'agente' ? 'Agente' : 'Equipe'} ·{' '}
                {formatDateTime(h.created_at)}
                {h.handed_to_human && ' · encaminhado para humano'}
                {h.photos_sent.length > 0 && ` · ${h.photos_sent.length} foto(s) enviada(s)`}
              </p>
              <p className="mt-2 whitespace-pre-line text-ink/80">{h.message}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3">
          <Field label="Anotação da equipe">
            <textarea className={inputClass} rows={2} value={teamNote} onChange={(e) => setTeamNote(e.target.value)} />
          </Field>
          <button type="button" disabled={busy || !teamNote.trim()} className={ghostButton} onClick={onAddNote}>
            Adicionar anotação
          </button>
        </div>
      </section>

      {isAdmin && (
        <section className="border-t border-line pt-8">
          <button type="button" disabled={busy} className={dangerButton} onClick={onDelete}>
            Excluir comprador e histórico (LGPD)
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
