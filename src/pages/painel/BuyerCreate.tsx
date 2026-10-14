import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { isValidCpf, onlyDigits, parseNum } from '../../lib/format'
import { createBuyerManually, listAllRegions } from '../../data/admin'
import { submissionErrorMessage } from '../../data/site'
import { Check, Field, inputClass, Notice, NumField, primaryButton, Section } from '../../components/ui'

/** Cadastro do comprador feito pela equipe (até o WhatsApp oficial entrar em uso). */
export default function BuyerCreate() {
  const navigate = useNavigate()
  const { data: regions } = useAsync(listAllRegions, [])

  const [f, setF] = useState({ name: '', cpf: '', whatsapp: '', email: '', priceMin: '', priceMax: '', profile: '' })
  const [kind, setKind] = useState<'final' | 'corretor'>('final')
  const [regionIds, setRegionIds] = useState<string[]>([])
  const [approve, setApprove] = useState(true)
  const [termOk, setTermOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))
  const toggleRegion = (id: string) =>
    setRegionIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  function validate(): string | null {
    if (f.name.trim().length < 3) return 'Informe o nome completo.'
    if (!isValidCpf(f.cpf)) return 'CPF inválido. Confira os números.'
    const wa = onlyDigits(f.whatsapp)
    if (wa.length < 10 || wa.length > 15) return 'Informe o WhatsApp com DDD (ex.: 15 99999-9999).'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Informe um e-mail válido (ele será o login).'
    if (regionIds.length === 0) return 'Escolha ao menos uma região de interesse.'
    const min = parseNum(f.priceMin)
    const max = parseNum(f.priceMax)
    for (const n of [min, max]) {
      if (n !== undefined && (!Number.isFinite(n) || n < 0)) return 'A faixa de valor precisa ser numérica.'
    }
    if (min !== undefined && max !== undefined && min > max) return 'O valor mínimo não pode ser maior que o máximo.'
    if (!termOk) return 'Confirme que o comprador aceitou o termo de confidencialidade.'
    return null
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setError(null)
    setBusy(true)
    try {
      const id = await createBuyerManually({
        name: f.name.trim(),
        cpf: onlyDigits(f.cpf),
        whatsapp: onlyDigits(f.whatsapp),
        email: f.email.trim(),
        region_ids: regionIds,
        price_min: parseNum(f.priceMin),
        price_max: parseNum(f.priceMax),
        property_profile: f.profile.trim() || undefined,
        kind,
        approve,
      })
      navigate(`/painel/compradores/${id}`)
    } catch (err) {
      setBusy(false)
      setError(submissionErrorMessage(err))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="max-w-3xl">
      <Link to="/painel/compradores" className="eyebrow text-mute hover:text-ink">← Compradores</Link>
      <h1 className="display mt-3 text-4xl text-ink">Cadastrar comprador</h1>
      <p className="mt-3 text-sm leading-relaxed text-mute">
        Cadastro feito pela equipe. Depois de salvar, crie a senha de acesso na tela do comprador e
        envie o login a ele.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-12">
        {error && <Notice tone="error">{error}</Notice>}

        <Section title="Dados">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Nome completo *" className="sm:col-span-2">
              <input className={inputClass} value={f.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="CPF *">
              <input className={inputClass} inputMode="numeric" value={f.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="WhatsApp *" hint="Com DDD.">
              <input className={inputClass} type="tel" inputMode="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <Field label="E-mail *" hint="Será o login do comprador." className="sm:col-span-2">
              <input className={inputClass} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            {([['final', 'Comprador final'], ['corretor', 'Corretor']] as const).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="kind"
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="h-4 w-4 accent-[var(--color-gold)]"
                />
                {label}
              </label>
            ))}
          </div>
        </Section>

        <Section title="O que procura">
          <p className="eyebrow text-mute">Regiões de interesse *</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {regions?.filter((r) => r.active).map((r) => (
              <Check key={r.id} checked={regionIds.includes(r.id)} onChange={() => toggleRegion(r.id)} label={r.name} hint={r.subtitle ?? undefined} />
            ))}
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <NumField label="Valor mínimo (R$)" value={f.priceMin} onChange={(v) => set('priceMin', v)} />
            <NumField label="Valor máximo (R$)" value={f.priceMax} onChange={(v) => set('priceMax', v)} />
          </div>
          <div className="mt-6">
            <Field label="Perfil do imóvel">
              <textarea className={inputClass} rows={3} value={f.profile} onChange={(e) => set('profile', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Confirmações">
          <div className="space-y-4">
            <Check
              checked={termOk}
              onChange={setTermOk}
              label="O comprador aceitou o termo de confidencialidade vigente. *"
              hint="O aceite fica registrado como confirmado pela equipe."
            />
            <Check
              checked={approve}
              onChange={setApprove}
              label="Já aprovar este comprador"
              hint="Desmarque para deixá-lo na fila de aprovação."
            />
          </div>
        </Section>

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className={primaryButton}>
            {busy ? 'Salvando…' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </div>
  )
}
