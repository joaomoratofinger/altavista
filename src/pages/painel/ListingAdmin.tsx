import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { useAuth } from '../../lib/auth'
import {
  deleteListing,
  getListing,
  listAllListings,
  listAllRegions,
  removeListingImages,
  saveListing,
  uploadListingImage,
} from '../../data/admin'
import { listingImageUrl } from '../../data/site'
import { parseNum } from '../../lib/format'
import { listingPriceLabel } from '../../components/ListingCard'
import { LISTING_PURPOSE_LABELS, LISTING_STATUS_LABELS, type Listing, type ListingPrivate, type ListingPurpose, type ListingStatus, type RegionImage } from '../../types/db'
import { Check, dangerButton, Field, ghostButton, inputClass, Notice, NumField, primaryButton, Section, StatusPill } from '../../components/ui'

export function ListingList() {
  const { data, loading, error } = useAsync(listAllListings, [])
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-soft">Site</p>
          <h1 className="display mt-2 text-4xl text-ink">Anúncios</h1>
        </div>
        <Link to="/painel/anuncios/novo" className={primaryButton}>+ Novo anúncio</Link>
      </div>
      <p className="mt-4 max-w-xl text-xs text-mute">
        Imóveis públicos, exibidos em <strong>/imoveis</strong>. Separados do acervo off market.
      </p>
      <div className="mt-6 space-y-4">
        {error && <Notice tone="error">Não foi possível carregar os anúncios.</Notice>}
        {loading && <p className="text-sm text-mute">Carregando…</p>}
        {!loading && !error && data?.length === 0 && <Notice>Nenhum anúncio cadastrado ainda.</Notice>}
      </div>
      <ul className="divide-y divide-line border-y border-line empty:hidden">
        {data?.map((l) => (
          <li key={l.id}>
            <Link to={`/painel/anuncios/${l.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-paper-soft/60">
              <div className="flex min-w-0 flex-1 basis-60 items-center gap-4">
                {l.images[0] ? (
                  <img src={listingImageUrl(l.images[0].path)} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-14 w-20 shrink-0 rounded-lg bg-card" />
                )}
                <div className="min-w-0">
                  <p className="display truncate text-xl text-ink">{l.title}</p>
                  <p className="mt-0.5 truncate text-xs text-mute">
                    {LISTING_PURPOSE_LABELS[l.purpose]} · {l.location} · {listingPriceLabel(l)}
                  </p>
                </div>
              </div>
              {l.featured && <StatusPill tone="neutral">Destaque</StatusPill>}
              <StatusPill tone={l.published ? 'ok' : 'wait'}>{l.published ? 'Publicado' : 'Rascunho'}</StatusPill>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export function ListingFormPage() {
  const { id } = useParams()
  const { data, loading, error } = useAsync(() => (id ? getListing(id) : Promise.resolve(null)), [id])
  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar o anúncio.</Notice>
  if (id && !data) return <Notice>Anúncio não encontrado.</Notice>
  return <ListingForm key={id ?? 'novo'} initial={data?.listing ?? null} initialPrivate={data?.private ?? null} />
}

const numText = (n: number | null | undefined) => (n == null ? '' : String(n))

function ListingForm({ initial, initialPrivate }: { initial: Listing | null; initialPrivate: ListingPrivate | null }) {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const { data: regions } = useAsync(listAllRegions, [])

  const [title, setTitle] = useState(initial?.title ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [location, setLocation] = useState(initial?.location ?? '')
  const [regionId, setRegionId] = useState(initial?.region_id ?? '')
  const [status, setStatus] = useState<ListingStatus>(initial?.status ?? 'disponivel')
  const [purpose, setPurpose] = useState<ListingPurpose>(initial?.purpose ?? 'venda')
  const [price, setPrice] = useState(numText(initial?.price))
  const [built, setBuilt] = useState(numText(initial?.built_area_m2))
  const [land, setLand] = useState(numText(initial?.land_area_m2))
  const [bedrooms, setBedrooms] = useState(numText(initial?.bedrooms))
  const [suites, setSuites] = useState(numText(initial?.suites))
  const [parking, setParking] = useState(numText(initial?.parking))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [highlights, setHighlights] = useState((initial?.highlights ?? []).join('\n'))
  const [images, setImages] = useState<RegionImage[]>(initial?.images ?? [])
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [published, setPublished] = useState(initial?.published ?? false)
  const [owner, setOwner] = useState({
    name: initialPrivate?.owner_name ?? '',
    phone: initialPrivate?.owner_phone ?? '',
    email: initialPrivate?.owner_email ?? '',
    notes: initialPrivate?.notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onUpload(files: FileList | null) {
    if (!files) return
    setBusy(true)
    setError(null)
    try {
      const added: RegionImage[] = []
      for (const file of [...files].filter((f) => f.type.startsWith('image/'))) {
        added.push({ path: await uploadListingImage(file) })
      }
      setImages((cur) => [...cur, ...added])
    } catch {
      setError('Falha ao enviar a imagem. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const move = (i: number, dir: -1 | 1) =>
    setImages((cur) => {
      const j = i + dir
      if (j < 0 || j >= cur.length) return cur
      const copy = [...cur]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  /** Número opcional: vazio -> null; texto inválido -> undefined (erro). */
  function num(s: string): number | null | undefined {
    const n = parseNum(s)
    if (n === undefined) return null
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !slug || !location.trim()) {
      setError('Informe o título, o endereço da página e a localização.')
      return
    }
    const values = [price, built, land, bedrooms, suites, parking].map(num)
    if (values.some((v) => v === undefined)) {
      setError('Valor, áreas e quantidades precisam ser números.')
      return
    }
    if (published && images.length === 0) {
      setError('Para publicar, adicione ao menos uma foto.')
      return
    }
    const [vPrice, vBuilt, vLand, vBedrooms, vSuites, vParking] = values as Array<number | null>
    const intOrNull = (n: number | null) => (n == null ? null : Math.round(n))

    setBusy(true)
    setError(null)
    try {
      await saveListing(
        {
          id: initial?.id,
          slug,
          title: title.trim(),
          location: location.trim(),
          region_id: regionId || null,
          status,
          purpose,
          price: vPrice,
          built_area_m2: vBuilt,
          land_area_m2: vLand,
          bedrooms: intOrNull(vBedrooms),
          suites: intOrNull(vSuites),
          parking: intOrNull(vParking),
          description: description.trim() || null,
          highlights: highlights.split('\n').map((h) => h.trim()).filter(Boolean),
          images,
          featured,
          published,
        },
        {
          owner_name: owner.name.trim() || null,
          owner_phone: owner.phone.trim() || null,
          owner_email: owner.email.trim() || null,
          notes: owner.notes.trim() || null,
        },
      )
      // Fotos retiradas nesta edição saem do bucket (best-effort).
      const kept = new Set(images.map((i) => i.path))
      await removeListingImages((initial?.images ?? []).map((i) => i.path).filter((p) => !kept.has(p))).catch(() => undefined)
      navigate('/painel/anuncios')
    } catch (err) {
      const code = (err as { code?: string })?.code
      setError(code === '23505' ? 'Já existe um anúncio com este endereço de página.' : 'Não foi possível salvar.')
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!initial || !window.confirm(`Excluir o anúncio "${initial.title}"? Não dá para desfazer.`)) return
    setBusy(true)
    try {
      await deleteListing(initial)
      navigate('/painel/anuncios')
    } catch {
      setError('Não foi possível excluir.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      <div>
        <Link to="/painel/anuncios" className="eyebrow text-mute hover:text-ink">← Anúncios</Link>
        <h1 className="display mt-3 text-4xl text-ink">{initial ? 'Editar anúncio' : 'Novo anúncio'}</h1>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <Section title="Anúncio" subtitle="Tudo aqui aparece no site.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Título *" className="sm:col-span-2">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!slugTouched) setSlug(slugify(e.target.value))
              }}
            />
          </Field>
          <Field label="Endereço da página *" hint={`/imovel/${slug || '…'}`}>
            <input
              className={inputClass}
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(slugify(e.target.value))
              }}
            />
          </Field>
          <Field label="Região">
            <select className={inputClass} value={regionId} onChange={(e) => setRegionId(e.target.value)}>
              <option value="">—</option>
              {regions?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Localização *" hint="Como aparece no site. Ex.: Condomínio Fazenda Boa Vista, Porto Feliz/SP" className="sm:col-span-2">
            <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
          </Field>
          <Field label="Situação">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as ListingStatus)}>
              {(Object.keys(LISTING_STATUS_LABELS) as ListingStatus[]).map((s) => (
                <option key={s} value={s}>{LISTING_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Finalidade">
            <select className={inputClass} value={purpose} onChange={(e) => setPurpose(e.target.value as ListingPurpose)}>
              {(Object.keys(LISTING_PURPOSE_LABELS) as ListingPurpose[]).map((p) => (
                <option key={p} value={p}>{LISTING_PURPOSE_LABELS[p]}</option>
              ))}
            </select>
          </Field>
          <NumField
            label={purpose === 'aluguel' ? 'Aluguel mensal (R$)' : 'Valor (R$)'}
            value={price}
            onChange={setPrice}
            hint="Vazio = “Sob consulta”."
          />
          <NumField label="Área construída (m²)" value={built} onChange={setBuilt} />
          <NumField label="Terreno (m²)" value={land} onChange={setLand} />
          <NumField label="Dormitórios" value={bedrooms} onChange={setBedrooms} />
          <NumField label="Suítes" value={suites} onChange={setSuites} />
          <NumField label="Vagas" value={parking} onChange={setParking} />
          <Field label="Descrição" className="sm:col-span-2">
            <textarea className={inputClass} rows={7} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Diferenciais" hint="Um por linha." className="sm:col-span-2">
            <textarea className={inputClass} rows={5} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Fotos" subtitle="A primeira é a capa. Aparecem publicamente no site.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <figure key={img.path} className="overflow-hidden rounded-xl border border-line">
              <img src={listingImageUrl(img.path)} alt="" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="flex justify-between gap-1 px-2 py-2 text-xs">
                <span className="eyebrow text-[0.58rem] text-gold-soft">{i === 0 ? 'Capa' : ''}</span>
                <span className="flex gap-1">
                  <button type="button" className="h-7 w-7 border border-line disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover para trás">←</button>
                  <button type="button" className="h-7 w-7 border border-line disabled:opacity-30" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Mover para frente">→</button>
                  <button type="button" className="h-7 w-7 border border-line hover:text-red-700" onClick={() => setImages((c) => c.filter((_, k) => k !== i))} aria-label="Remover foto">✕</button>
                </span>
              </figcaption>
            </figure>
          ))}
          <label className="flex aspect-[4/3] cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-mute transition-colors hover:border-gold hover:text-ink">
            <span className="eyebrow">{busy ? 'Enviando…' : '+ Fotos'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                void onUpload(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </Section>

      <Section title="Dados internos" subtitle="Só a equipe vê. Nunca aparecem no site.">
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Proprietário">
            <input className={inputClass} value={owner.name} onChange={(e) => setOwner({ ...owner, name: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <input className={inputClass} type="tel" value={owner.phone} onChange={(e) => setOwner({ ...owner, phone: e.target.value })} />
          </Field>
          <Field label="E-mail" className="sm:col-span-2">
            <input className={inputClass} type="email" value={owner.email} onChange={(e) => setOwner({ ...owner, email: e.target.value })} />
          </Field>
          <Field label="Anotações" hint="Comissão, exclusividade, observações." className="sm:col-span-2">
            <textarea className={inputClass} rows={4} value={owner.notes} onChange={(e) => setOwner({ ...owner, notes: e.target.value })} />
          </Field>
        </div>
      </Section>

      <div className="space-y-4">
        <Check checked={published} onChange={setPublished} label="Publicado" hint="Desmarcado, fica como rascunho e só a equipe vê." />
        <Check checked={featured} onChange={setFeatured} label="Destaque na página inicial" />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {initial && isAdmin && (
          <button type="button" disabled={busy} className={dangerButton} onClick={onDelete}>
            Excluir
          </button>
        )}
        <span className="mr-auto" />
        <Link to="/painel/anuncios" className={ghostButton}>Cancelar</Link>
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
