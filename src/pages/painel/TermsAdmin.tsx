import { useState } from 'react'
import { useAsync } from '../../lib/useAsync'
import { listTerms, publishTerm } from '../../data/admin'
import { formatDateTime } from '../../lib/format'
import type { TermKind } from '../../types/db'
import { Field, inputClass, Notice, primaryButton, StatusPill } from '../../components/ui'

const KINDS: Array<{ kind: TermKind; label: string }> = [
  { kind: 'proprietario', label: 'Termo do proprietário (sigilo e autorização)' },
  { kind: 'comprador', label: 'Termo do comprador (confidencialidade)' },
]

export default function TermsAdmin() {
  const [reload, setReload] = useState(0)
  const { data, loading, error } = useAsync(listTerms, [reload])

  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar os termos.</Notice>

  return (
    <div className="space-y-14">
      <div>
        <p className="eyebrow text-gold-soft">Jurídico</p>
        <h1 className="display mt-2 text-4xl text-ink">Termos</h1>
        <p className="mt-3 max-w-xl text-xs text-mute">
          Cada alteração publica uma nova versão. O aceite de cada pessoa guarda a versão que ela viu.
        </p>
      </div>
      {KINDS.map(({ kind, label }) => (
        <TermEditor
          key={kind}
          label={label}
          kind={kind}
          versions={(data ?? []).filter((t) => t.kind === kind)}
          onPublished={() => setReload((n) => n + 1)}
        />
      ))}
    </div>
  )
}

function TermEditor({
  label,
  kind,
  versions,
  onPublished,
}: {
  label: string
  kind: TermKind
  versions: Array<{ id: string; version: number; body: string; active: boolean; created_at: string }>
  onPublished: () => void
}) {
  const current = versions.find((v) => v.active)
  const [body, setBody] = useState(current?.body ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  async function onPublish() {
    if (!body.trim() || body.trim() === current?.body.trim()) return
    if (!window.confirm('Publicar nova versão? Ela passa a valer para os próximos cadastros.')) return
    setBusy(true)
    setMsg(null)
    try {
      await publishTerm(kind, body.trim())
      setMsg({ tone: 'success', text: 'Nova versão publicada.' })
      onPublished()
    } catch {
      setMsg({ tone: 'error', text: 'Não foi possível publicar.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border-b border-line pb-3">
        <h2 className="display text-2xl text-ink">{label}</h2>
        {current && <StatusPill tone="ok">Vigente: v{current.version}</StatusPill>}
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Field label="Texto">
        <textarea className={inputClass} rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
      </Field>
      <button type="button" disabled={busy || !body.trim() || body.trim() === current?.body.trim()} className={primaryButton} onClick={onPublish}>
        Publicar nova versão
      </button>
      {versions.length > 1 && (
        <p className="text-xs text-mute">
          Versões anteriores: {versions.filter((v) => !v.active).map((v) => `v${v.version} (${formatDateTime(v.created_at)})`).join(' · ')}
        </p>
      )}
    </section>
  )
}
