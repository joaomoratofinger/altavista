import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { isConfigured } from '../lib/supabase'
import { isValidCpf, onlyDigits, parseNum } from '../lib/format'
import { getActiveTerm, listRegions, submissionErrorMessage, submitBuyer } from '../data/site'
import { Check, Field, inputClass, Notice, NumField, primaryButton, Section, TermBox } from '../components/ui'

export default function BuyerForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: regions } = useAsync(listRegions, [])
  const { data: term } = useAsync(() => getActiveTerm('comprador'), [])

  const [f, setF] = useState({
    name: '', cpf: '', whatsapp: '', email: '', priceMin: '', priceMax: '', profile: '',
  })
  const [kind, setKind] = useState<'final' | 'corretor'>('final')
  const [regionIds, setRegionIds] = useState<string[]>([])
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  const preselected = useMemo(
    () => regions?.find((r) => r.slug === params.get('regiao'))?.id,
    [regions, params],
  )
  useEffect(() => {
    if (preselected) setRegionIds((cur) => (cur.length ? cur : [preselected]))
  }, [preselected])

  const toggleRegion = (id: string) =>
    setRegionIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  function validate(): string | null {
    if (f.name.trim().length < 3) return 'Informe seu nome completo.'
    if (!isValidCpf(f.cpf)) return 'CPF inválido. Confira os números.'
    const wa = onlyDigits(f.whatsapp)
    if (wa.length < 10 || wa.length > 15) return 'Informe o WhatsApp com DDD (ex.: 15 99999-9999).'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Informe um e-mail válido.'
    if (regionIds.length === 0) return 'Escolha ao menos uma região de interesse.'
    const min = parseNum(f.priceMin)
    const max = parseNum(f.priceMax)
    for (const n of [min, max]) {
      if (n !== undefined && (!Number.isFinite(n) || n < 0)) return 'A faixa de valor precisa ser numérica.'
    }
    if (min !== undefined && max !== undefined && min > max) return 'O valor mínimo não pode ser maior que o máximo.'
    if (!accepted) return 'É necessário aceitar o termo de confidencialidade.'
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
      await submitBuyer({
        name: f.name.trim(),
        cpf: onlyDigits(f.cpf),
        whatsapp: onlyDigits(f.whatsapp),
        email: f.email.trim(),
        region_ids: regionIds,
        price_min: parseNum(f.priceMin),
        price_max: parseNum(f.priceMax),
        property_profile: f.profile.trim() || undefined,
        kind,
        terms_accepted: accepted,
      })
      navigate('/obrigado?tipo=comprador')
    } catch (err) {
      setBusy(false)
      setError(submissionErrorMessage(err))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <p className="eyebrow text-gold-soft">Compradores</p>
      <h1 className="display mt-4 text-4xl text-ink sm:text-5xl">Solicite seu acesso</h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-mute">
        O acervo é reservado. Todo cadastro passa por aprovação manual da nossa equipe; depois de
        aprovado, você recebe uma mensagem no WhatsApp com o acesso.
      </p>

      {!isConfigured && (
        <div className="mt-8">
          <Notice>O cadastro estará disponível assim que o banco de dados for configurado.</Notice>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-12 space-y-14">
        {error && <Notice tone="error">{error}</Notice>}

        <Section title="Seus dados">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Nome completo *" className="sm:col-span-2">
              <input className={inputClass} autoComplete="name" value={f.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="CPF *">
              <input className={inputClass} inputMode="numeric" value={f.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="WhatsApp *" hint="Com DDD.">
              <input className={inputClass} type="tel" autoComplete="tel" inputMode="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <Field label="E-mail *" className="sm:col-span-2">
              <input className={inputClass} type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
          <div className="mt-6">
            <p className="eyebrow text-mute">Você é *</p>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3">
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
          </div>
        </Section>

        <Section title="O que você procura">
          <p className="eyebrow text-mute">Regiões de interesse *</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {regions?.map((r) => (
              <Check key={r.id} checked={regionIds.includes(r.id)} onChange={() => toggleRegion(r.id)} label={r.name} hint={r.subtitle ?? undefined} />
            ))}
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <NumField label="Valor mínimo (R$)" value={f.priceMin} onChange={(v) => set('priceMin', v)} />
            <NumField label="Valor máximo (R$)" value={f.priceMax} onChange={(v) => set('priceMax', v)} />
          </div>
          <div className="mt-6">
            <Field label="Perfil do imóvel" hint="Ex.: casa térrea contemporânea, mínimo 5 suítes, piscina.">
              <textarea className={inputClass} rows={4} value={f.profile} onChange={(e) => set('profile', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Confidencialidade">
          <TermBox
            title="Termo de confidencialidade"
            body={term?.body}
            accepted={accepted}
            onChange={setAccepted}
            acceptLabel="Li e aceito o termo de confidencialidade."
          />
        </Section>

        <div className="flex justify-end">
          <button type="submit" disabled={busy || !isConfigured} className={primaryButton}>
            {busy ? 'Enviando…' : 'Solicitar acesso'}
          </button>
        </div>
      </form>
    </div>
  )
}
