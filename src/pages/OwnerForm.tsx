import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAsync } from '../lib/useAsync'
import { isConfigured } from '../lib/supabase'
import { onlyDigits, parseNum } from '../lib/format'
import {
  getActiveTerm,
  listRegions,
  submissionErrorMessage,
  submitOwner,
  type OwnerMediaFile,
} from '../data/site'
import {
  Check,
  Field,
  inputClass,
  Notice,
  NumField,
  primaryButton,
  Section,
  TermBox,
} from '../components/ui'

const MAX_PHOTOS = 30
const MAX_VIDEO_MB = 250
const MAX_PLAN_MB = 20

interface Photo {
  file: File
  preview: string
}

export default function OwnerForm() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: regions } = useAsync(listRegions, [])
  const { data: term } = useAsync(() => getActiveTerm('proprietario'), [])

  const [f, setF] = useState({
    name: '', whatsapp: '', email: '', regionId: '', locationDetail: '',
    landArea: '', builtArea: '', bedrooms: '', suites: '', parking: '',
    highlights: '', askingPrice: '',
  })
  const [acceptsContact, setAcceptsContact] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [plan, setPlan] = useState<File | null>(null)
  const [video, setVideo] = useState<File | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const set = (k: keyof typeof f, v: string) => setF((s) => ({ ...s, [k]: v }))

  // Região vinda do botão "Sou proprietário" da aba.
  const preselected = useMemo(
    () => regions?.find((r) => r.slug === params.get('regiao'))?.id,
    [regions, params],
  )
  useEffect(() => {
    if (preselected) setF((s) => (s.regionId ? s : { ...s, regionId: preselected }))
  }, [preselected])

  // Libera as pré-visualizações ao sair.
  useEffect(
    () => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  function addPhotos(files: FileList | null) {
    if (!files) return
    const images = [...files].filter((x) => x.type.startsWith('image/'))
    setPhotos((cur) => {
      const room = MAX_PHOTOS - cur.length
      if (images.length > room) setError(`O limite é de ${MAX_PHOTOS} fotos.`)
      return [...cur, ...images.slice(0, Math.max(0, room)).map((file) => ({ file, preview: URL.createObjectURL(file) }))]
    })
  }

  function removePhoto(i: number) {
    setPhotos((cur) => {
      URL.revokeObjectURL(cur[i].preview)
      return cur.filter((_, idx) => idx !== i)
    })
  }

  function validate(): string | null {
    if (f.name.trim().length < 3) return 'Informe seu nome completo.'
    const wa = onlyDigits(f.whatsapp)
    if (wa.length < 10 || wa.length > 15) return 'Informe o WhatsApp com DDD (ex.: 15 99999-9999).'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return 'Informe um e-mail válido.'
    if (!f.regionId) return 'Escolha a região do imóvel.'
    if (f.locationDetail.trim().length < 2) return 'Informe o condomínio ou bairro.'
    for (const [k, label] of [
      ['landArea', 'Área do terreno'], ['builtArea', 'Área construída'], ['bedrooms', 'Quartos'],
      ['suites', 'Suítes'], ['parking', 'Vagas'], ['askingPrice', 'Valor pretendido'],
    ] as const) {
      const n = parseNum(f[k])
      if (n !== undefined && (!Number.isFinite(n) || n < 0)) return `O campo “${label}” precisa ser um número.`
    }
    if (photos.length === 0) return 'Envie ao menos uma foto do imóvel.'
    if (plan && plan.size > MAX_PLAN_MB * 1024 * 1024) return `A planta deve ter até ${MAX_PLAN_MB} MB.`
    if (video && video.size > MAX_VIDEO_MB * 1024 * 1024) return `O vídeo deve ter até ${MAX_VIDEO_MB} MB.`
    if (!accepted) return 'É necessário aceitar o termo de sigilo e autorização.'
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
    setProgress('Enviando…')

    const files: OwnerMediaFile[] = [
      ...photos.map((p) => ({ file: p.file, kind: 'foto' as const })),
      ...(plan ? [{ file: plan, kind: 'planta' as const }] : []),
      ...(video ? [{ file: video, kind: 'video' as const }] : []),
    ]
    try {
      await submitOwner(
        {
          name: f.name.trim(),
          whatsapp: onlyDigits(f.whatsapp),
          email: f.email.trim(),
          region_id: f.regionId,
          location_detail: f.locationDetail.trim(),
          land_area_m2: parseNum(f.landArea),
          built_area_m2: parseNum(f.builtArea),
          bedrooms: parseNum(f.bedrooms),
          suites: parseNum(f.suites),
          parking: parseNum(f.parking),
          highlights: f.highlights.trim() || undefined,
          asking_price: parseNum(f.askingPrice),
          accepts_buyer_contact: acceptsContact,
          terms_accepted: accepted,
        },
        files,
        (done, total) => setProgress(`Enviando arquivos ${done} de ${total}…`),
      )
      navigate('/obrigado?tipo=proprietario')
    } catch (err) {
      setProgress(null)
      setError(submissionErrorMessage(err))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const busy = progress !== null

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-36 sm:px-8 sm:pt-44">
      <p className="eyebrow text-gold-soft">Proprietários</p>
      <h1 className="display mt-4 text-4xl text-ink sm:text-5xl">Cadastre seu imóvel</h1>
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-mute">
        As informações ficam em sigilo. Nossa equipe analisa o cadastro e retorna pelo WhatsApp;
        o imóvel só é apresentado a compradores previamente aprovados.
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
            <Field label="WhatsApp *" hint="Com DDD. Você receberá a confirmação por aqui.">
              <input className={inputClass} type="tel" autoComplete="tel" inputMode="tel" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
            </Field>
            <Field label="E-mail *">
              <input className={inputClass} type="email" autoComplete="email" value={f.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="O imóvel">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Região *">
              <select className={inputClass} value={f.regionId} onChange={(e) => set('regionId', e.target.value)}>
                <option value="">Selecione…</option>
                {regions?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Condomínio / bairro *">
              <input className={inputClass} value={f.locationDetail} onChange={(e) => set('locationDetail', e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-5">
            <NumField label="Terreno (m²)" value={f.landArea} onChange={(v) => set('landArea', v)} />
            <NumField label="Construída (m²)" value={f.builtArea} onChange={(v) => set('builtArea', v)} />
            <NumField label="Quartos" value={f.bedrooms} onChange={(v) => set('bedrooms', v)} />
            <NumField label="Suítes" value={f.suites} onChange={(v) => set('suites', v)} />
            <NumField label="Vagas" value={f.parking} onChange={(v) => set('parking', v)} />
          </div>
          <div className="mt-6 grid gap-6">
            <Field label="Diferenciais">
              <textarea className={inputClass} rows={4} value={f.highlights} onChange={(e) => set('highlights', e.target.value)} />
            </Field>
            <NumField label="Valor pretendido (R$)" value={f.askingPrice} onChange={(v) => set('askingPrice', v)} hint="Só números. Opcional." />
            <Check
              checked={acceptsContact}
              onChange={setAcceptsContact}
              label="Aceito ser contatado por compradores"
              hint="Se desmarcado, todo contato passa apenas pela nossa equipe."
            />
          </div>
        </Section>

        <Section title="Fotos e arquivos" subtitle={`Até ${MAX_PHOTOS} fotos. Planta e vídeo são opcionais.`}>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative aspect-square overflow-hidden bg-card">
                <img src={p.preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => removePhoto(i)}
                  className="absolute right-1 top-1 h-7 w-7 bg-paper/90 text-xs text-ink hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex aspect-square cursor-pointer items-center justify-center border border-dashed border-line px-2 text-center text-mute transition-colors hover:border-gold hover:text-ink">
                <span className="eyebrow text-[0.58rem]">+ Fotos ({photos.length}/{MAX_PHOTOS})</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    addPhotos(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Field label="Planta (opcional)" hint={`Imagem ou PDF, até ${MAX_PLAN_MB} MB.`}>
              <input
                type="file"
                accept="image/*,application/pdf"
                className={inputClass}
                onChange={(e) => setPlan(e.target.files?.[0] ?? null)}
              />
            </Field>
            <Field label="Vídeo (opcional)" hint={`MP4 ou MOV, até ${MAX_VIDEO_MB} MB.`}>
              <input
                type="file"
                accept="video/mp4,video/quicktime"
                className={inputClass}
                onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
              />
            </Field>
          </div>
        </Section>

        <Section title="Sigilo e autorização">
          <TermBox
            title="Termo de sigilo e autorização de apresentação a compradores selecionados"
            body={term?.body}
            accepted={accepted}
            onChange={setAccepted}
            acceptLabel="Li e aceito o termo de sigilo e autorizo a apresentação do imóvel a compradores selecionados."
          />
        </Section>

        <div className="flex flex-wrap items-center justify-end gap-4">
          {progress && <span className="mr-auto text-sm text-mute">{progress}</span>}
          <button type="submit" disabled={busy || !isConfigured} className={primaryButton}>
            {busy ? 'Enviando…' : 'Enviar cadastro'}
          </button>
        </div>
      </form>
    </div>
  )
}
