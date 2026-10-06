import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import {
  deleteStoredImages,
  getPropertyRecord,
  newPropertyId,
  saveProperty,
  uploadPropertyImage,
} from '../../data/adminProperties'
import {
  STATUS_LABELS,
  type PropertyImage,
  type PropertyRecord,
  type PropertyStatus,
} from '../../types/property'
import { Field, ghostButton, inputClass, Notice, primaryButton } from './ui'

/** Carrega o imóvel (quando editando) e entrega ao formulário. */
export default function PropertyFormPage() {
  const { id } = useParams()
  const { data, loading, error } = useAsync(
    () => (id ? getPropertyRecord(id) : Promise.resolve(null)),
    [id],
  )

  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar o imóvel.</Notice>
  if (id && !data) {
    return (
      <div className="space-y-4">
        <Notice>Imóvel não encontrado.</Notice>
        <Link to="/painel" className="eyebrow text-gold">← Voltar</Link>
      </div>
    )
  }
  return <PropertyForm key={id ?? 'novo'} initial={data} />
}

// ---------------------------------------------------------------------------

/** Foto já gravada no Storage ou arquivo escolhido que ainda vai subir. */
type Photo =
  | { kind: 'saved'; image: PropertyImage }
  | { kind: 'new'; file: File; preview: string }

interface FormState {
  title: string
  slug: string
  status: PropertyStatus
  published: boolean
  featured: boolean
  location: string
  region: string
  price: string
  builtAreaM2: string
  landAreaM2: string
  landAlqueires: string
  bedrooms: string
  suites: string
  parking: string
  description: string
  highlights: string
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  dealTerms: string
  internalNotes: string
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toStr = (n?: number | null) => (n == null ? '' : String(n).replace('.', ','))

/** "24.500.000" / "12,5" -> número. Vazio -> undefined. Inválido -> NaN. */
function parseNum(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  return Number(t.replace(/\./g, '').replace(',', '.'))
}

function today() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function initialState(r: PropertyRecord | null): FormState {
  return {
    title: r?.title ?? '',
    slug: r?.slug ?? '',
    status: r?.status ?? 'disponivel',
    published: r?.published ?? false,
    featured: r?.featured ?? false,
    location: r?.location ?? '',
    region: r?.region ?? '',
    price: toStr(r?.price),
    builtAreaM2: toStr(r?.builtAreaM2),
    landAreaM2: toStr(r?.landAreaM2),
    landAlqueires: toStr(r?.landAlqueires),
    bedrooms: toStr(r?.bedrooms),
    suites: toStr(r?.suites),
    parking: toStr(r?.parking),
    description: r?.description ?? '',
    highlights: (r?.highlights ?? []).join('\n'),
    ownerName: r?.private.ownerName ?? '',
    ownerPhone: r?.private.ownerPhone ?? '',
    ownerEmail: r?.private.ownerEmail ?? '',
    dealTerms: r?.private.dealTerms ?? '',
    internalNotes: r?.private.internalNotes ?? '',
  }
}

const NUMERIC_FIELDS: Array<[keyof FormState, string]> = [
  ['price', 'Valor'],
  ['builtAreaM2', 'Área construída'],
  ['landAreaM2', 'Terreno (m²)'],
  ['landAlqueires', 'Terreno (alqueires)'],
  ['bedrooms', 'Dormitórios'],
  ['suites', 'Suítes'],
  ['parking', 'Vagas'],
]

function PropertyForm({ initial }: { initial: PropertyRecord | null }) {
  const navigate = useNavigate()
  const isNew = !initial
  // Id fixo durante toda a edição: as fotos sobem em `properties/{id}/…`.
  const id = useMemo(() => initial?.id ?? newPropertyId(), [initial])

  const [form, setForm] = useState<FormState>(() => initialState(initial))
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [photos, setPhotos] = useState<Photo[]>(
    () => initial?.images.map((image) => ({ kind: 'saved', image })) ?? [],
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Libera as URLs de pré-visualização ao sair da tela.
  useEffect(
    () => () => {
      photos.forEach((p) => p.kind === 'new' && URL.revokeObjectURL(p.preview))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  function onTitle(title: string) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
  }

  function addFiles(files: FileList | null) {
    if (!files) return
    const added: Photo[] = [...files]
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ kind: 'new', file, preview: URL.createObjectURL(file) }))
    setPhotos((p) => [...p, ...added])
  }

  function removePhoto(i: number) {
    setPhotos((list) => {
      const item = list[i]
      if (item?.kind === 'new') URL.revokeObjectURL(item.preview)
      return list.filter((_, idx) => idx !== i)
    })
  }

  function movePhoto(i: number, dir: -1 | 1) {
    setPhotos((list) => {
      const j = i + dir
      if (j < 0 || j >= list.length) return list
      const copy = [...list]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Informe o nome do imóvel.'
    if (!form.slug.trim()) return 'Informe o endereço da página (slug).'
    if (!form.location.trim()) return 'Informe a localização.'
    if (!form.region.trim()) return 'Informe a região.'
    for (const [key, label] of NUMERIC_FIELDS) {
      const n = parseNum(form[key] as string)
      if (n !== undefined && (!Number.isFinite(n) || n < 0)) {
        return `O campo “${label}” precisa ser um número.`
      }
    }
    if (form.published && photos.length === 0) {
      return 'Para publicar no site, adicione pelo menos uma foto (ou salve como rascunho).'
    }
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
    // Fotos que já estavam no imóvel e foram removidas nesta edição.
    const keptPaths = new Set(
      photos.flatMap((p) => (p.kind === 'saved' && p.image.path ? [p.image.path] : [])),
    )
    const removed = (initial?.images ?? []).filter((img) => !img.path || !keptPaths.has(img.path))

    // Sobe as fotos novas; cada uma que conclui vira "saved" para não repetir num novo envio.
    const working = [...photos]
    const total = working.filter((p) => p.kind === 'new').length
    let done = 0
    try {
      for (let i = 0; i < working.length; i++) {
        const p = working[i]
        if (p.kind !== 'new') continue
        setSaving(`Enviando foto ${++done} de ${total}…`)
        const image = await uploadPropertyImage(id, p.file)
        URL.revokeObjectURL(p.preview)
        working[i] = { kind: 'saved', image }
      }
    } catch {
      setPhotos(working)
      setSaving(null)
      setError('Falha ao enviar as fotos. Verifique a conexão e tente salvar novamente.')
      return
    }
    setPhotos(working)

    setSaving('Salvando…')
    const numbers = (k: keyof FormState) => parseNum(form[k] as string)
    const optional = (s: string) => s.trim() || undefined
    const record: PropertyRecord = {
      id,
      slug: form.slug.trim(),
      title: form.title.trim(),
      status: form.status,
      published: form.published,
      featured: form.featured,
      location: form.location.trim(),
      region: form.region.trim(),
      price: numbers('price') ?? null,
      builtAreaM2: numbers('builtAreaM2'),
      landAreaM2: numbers('landAreaM2'),
      landAlqueires: numbers('landAlqueires'),
      bedrooms: numbers('bedrooms'),
      suites: numbers('suites'),
      parking: numbers('parking'),
      description: optional(form.description),
      highlights: form.highlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean),
      images: working.flatMap((p) => (p.kind === 'saved' ? [p.image] : [])),
      createdAt: initial?.createdAt ?? today(),
      private: {
        ownerName: form.ownerName.trim(),
        ownerPhone: optional(form.ownerPhone),
        ownerEmail: optional(form.ownerEmail),
        dealTerms: optional(form.dealTerms),
        internalNotes: optional(form.internalNotes),
      },
    }

    try {
      await saveProperty(record)
    } catch (err) {
      setSaving(null)
      setError(err instanceof Error && err.message.startsWith('Já existe')
        ? err.message
        : 'Não foi possível salvar. Tente novamente.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    // Limpeza best-effort: o imóvel já está salvo, então falha aqui não bloqueia.
    await deleteStoredImages(removed).catch(() => undefined)
    navigate('/painel')
  }

  const busy = saving !== null

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/painel" className="eyebrow text-mute hover:text-ink">← Imóveis</Link>
          <h1 className="display mt-3 text-4xl text-ink">
            {isNew ? 'Novo imóvel' : 'Editar imóvel'}
          </h1>
        </div>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {/* ---------- Dados públicos ---------- */}
      <Section title="Dados do site" subtitle="Tudo desta seção aparece publicamente quando o imóvel está publicado.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Nome do imóvel *">
            <input className={inputClass} value={form.title} onChange={(e) => onTitle(e.target.value)} />
          </Field>
          <Field label="Endereço da página *" hint={`/imovel/${form.slug || '…'}`}>
            <input
              className={inputClass}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                set('slug', slugify(e.target.value))
              }}
            />
          </Field>
          <Field label="Localização *" hint="Ex.: Porto Feliz — SP ou Condomínio Fazenda Boa Vista">
            <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} />
          </Field>
          <Field label="Região *" hint="Usada no filtro do portfólio. Ex.: Porto Feliz, Boituva, Portugal">
            <input className={inputClass} value={form.region} onChange={(e) => set('region', e.target.value)} />
          </Field>
          <Field label="Situação">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as PropertyStatus)}
            >
              {(Object.keys(STATUS_LABELS) as PropertyStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Valor (R$)" hint="Só números. Deixe em branco para exibir “Sob consulta”.">
            <input className={inputClass} inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} />
          </Field>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-6">
          <Num label="Área construída (m²)" value={form.builtAreaM2} onChange={(v) => set('builtAreaM2', v)} />
          <Num label="Terreno (m²)" value={form.landAreaM2} onChange={(v) => set('landAreaM2', v)} />
          <Num label="Terreno (alqueires)" value={form.landAlqueires} onChange={(v) => set('landAlqueires', v)} />
          <Num label="Dormitórios" value={form.bedrooms} onChange={(v) => set('bedrooms', v)} />
          <Num label="Suítes" value={form.suites} onChange={(v) => set('suites', v)} />
          <Num label="Vagas" value={form.parking} onChange={(v) => set('parking', v)} />
        </div>

        <div className="mt-6 grid gap-6">
          <Field label="Descrição">
            <textarea className={inputClass} rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <Field label="Diferenciais" hint="Um por linha.">
            <textarea className={inputClass} rows={5} value={form.highlights} onChange={(e) => set('highlights', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ---------- Fotos ---------- */}
      <Section title="Fotos" subtitle="A primeira foto é a capa. Use as setas para reordenar. As fotos são redimensionadas automaticamente.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((p, i) => (
            <figure key={p.kind === 'saved' ? p.image.url : p.preview} className="border border-line bg-white/50">
              <div className="aspect-[4/3] overflow-hidden bg-card">
                <img
                  src={p.kind === 'saved' ? p.image.url : p.preview}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="flex items-center justify-between gap-1 px-2 py-2 text-xs">
                <span className="eyebrow text-[0.58rem] text-gold-soft">
                  {i === 0 ? 'Capa' : p.kind === 'new' ? 'Nova' : ''}
                </span>
                <span className="flex gap-1">
                  <IconButton label="Mover para trás" disabled={i === 0} onClick={() => movePhoto(i, -1)}>←</IconButton>
                  <IconButton label="Mover para frente" disabled={i === photos.length - 1} onClick={() => movePhoto(i, 1)}>→</IconButton>
                  <IconButton label="Remover foto" danger onClick={() => removePhoto(i)}>✕</IconButton>
                </span>
              </figcaption>
            </figure>
          ))}
          <label className="flex aspect-[4/3] cursor-pointer items-center justify-center border border-dashed border-line text-center text-xs text-mute transition-colors hover:border-gold hover:text-ink">
            <span className="eyebrow px-3">+ Adicionar fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </Section>

      {/* ---------- Publicação ---------- */}
      <Section title="Publicação">
        <div className="space-y-4">
          <Check
            checked={form.published}
            onChange={(v) => set('published', v)}
            label="Publicado no site"
            hint="Desmarcado, o imóvel fica como rascunho e só aparece aqui no painel."
          />
          <Check
            checked={form.featured}
            onChange={(v) => set('featured', v)}
            label="Destaque na home"
            hint="Aparece na “Seleção atual” da página inicial."
          />
        </div>
      </Section>

      {/* ---------- Dados privados ---------- */}
      <Section
        title="Proprietário — uso interno"
        subtitle="Estes dados ficam protegidos por login e nunca aparecem no site."
        private
      >
        <div className="grid gap-6 sm:grid-cols-3">
          <Field label="Nome do proprietário">
            <input className={inputClass} value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
          </Field>
          <Field label="Telefone">
            <input className={inputClass} type="tel" value={form.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} />
          </Field>
          <Field label="E-mail">
            <input className={inputClass} type="email" value={form.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} />
          </Field>
        </div>
        <div className="mt-6 grid gap-6">
          <Field label="Condições do negócio" hint="Comissão, exclusividade, prazo, etc.">
            <textarea className={inputClass} rows={3} value={form.dealTerms} onChange={(e) => set('dealTerms', e.target.value)} />
          </Field>
          <Field label="Anotações internas">
            <textarea className={inputClass} rows={4} value={form.internalNotes} onChange={(e) => set('internalNotes', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* ---------- Ações ---------- */}
      <div className="sticky bottom-0 -mx-5 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-paper/95 px-5 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        {saving && <span className="mr-auto text-sm text-mute">{saving}</span>}
        <Link to="/painel" className={ghostButton} aria-disabled={busy}>
          Cancelar
        </Link>
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Salvando…' : isNew ? 'Cadastrar imóvel' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  private: isPrivate,
  children,
}: {
  title: string
  subtitle?: string
  private?: boolean
  children: React.ReactNode
}) {
  return (
    <section className={isPrivate ? 'border border-gold-soft/40 bg-paper-soft p-6 sm:p-8' : ''}>
      <div className="mb-6 border-b border-line pb-3">
        <h2 className="display text-2xl text-ink">
          {title}
          {isPrivate && <span className="eyebrow ml-3 align-middle text-gold-soft">Privado</span>}
        </h2>
        {subtitle && <p className="mt-1 text-xs text-mute">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Field label={label}>
      <input className={inputClass} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    </Field>
  )
}

function Check({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 accent-[var(--color-gold)]"
      />
      <span>
        <span className="text-sm text-ink">{label}</span>
        {hint && <span className="block text-xs text-mute">{hint}</span>}
      </span>
    </label>
  )
}

function IconButton({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`h-7 w-7 border border-line text-xs transition-colors disabled:opacity-30 ${
        danger ? 'hover:border-red-400 hover:text-red-700' : 'hover:border-gold-soft'
      }`}
    >
      {children}
    </button>
  )
}
