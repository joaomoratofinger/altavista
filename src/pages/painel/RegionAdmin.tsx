import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import {
  deleteRegion,
  getRegion,
  listAllRegions,
  removeRegionImages,
  saveRegion,
  uploadRegionImage,
} from '../../data/admin'
import { regionImageUrl } from '../../data/site'
import type { Region, RegionImage } from '../../types/db'
import { Check, dangerButton, Field, ghostButton, inputClass, Notice, primaryButton, StatusPill } from '../../components/ui'

export function RegionList() {
  const { data, loading, error } = useAsync(listAllRegions, [])
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-soft">Site</p>
          <h1 className="display mt-2 text-4xl text-ink">Regiões</h1>
        </div>
        <Link to="/painel/regioes/nova" className={primaryButton}>+ Nova região</Link>
      </div>
      <p className="mt-4 max-w-xl text-xs text-mute">
        Cada região ativa vira uma aba no site, sem precisar de novo deploy.
      </p>
      <div className="mt-6 space-y-4">
        {error && <Notice tone="error">Não foi possível carregar as regiões.</Notice>}
        {loading && <p className="text-sm text-mute">Carregando…</p>}
      </div>
      <ul className="divide-y divide-line border-y border-line empty:hidden">
        {data?.map((r) => (
          <li key={r.id}>
            <Link to={`/painel/regioes/${r.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 py-4 hover:bg-paper-soft/60">
              <div className="min-w-0 flex-1 basis-60">
                <p className="display text-xl text-ink">{r.name}</p>
                <p className="mt-0.5 text-xs text-mute">/regiao/{r.slug}</p>
              </div>
              <StatusPill tone={r.active ? 'ok' : 'neutral'}>{r.active ? 'Ativa' : 'Inativa'}</StatusPill>
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

export function RegionFormPage() {
  const { id } = useParams()
  const { data, loading, error } = useAsync(() => (id ? getRegion(id) : Promise.resolve(null)), [id])
  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar a região.</Notice>
  if (id && !data) return <Notice>Região não encontrada.</Notice>
  return <RegionForm key={id ?? 'nova'} initial={data} />
}

function RegionForm({ initial }: { initial: Region | null }) {
  const navigate = useNavigate()
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order ?? 0))
  const [showCount, setShowCount] = useState(initial?.show_count ?? false)
  const [active, setActive] = useState(initial?.active ?? true)
  const [images, setImages] = useState<RegionImage[]>(initial?.images ?? [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onUpload(files: FileList | null) {
    if (!files) return
    setBusy(true)
    setError(null)
    try {
      const added: RegionImage[] = []
      for (const file of [...files].filter((f) => f.type.startsWith('image/'))) {
        added.push({ path: await uploadRegionImage(file) })
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) {
      setError('Informe o nome e o endereço da página.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveRegion({
        id: initial?.id,
        name: name.trim(),
        slug,
        subtitle: subtitle.trim() || null,
        body: body.trim() || null,
        images,
        show_count: showCount,
        active,
        sort_order: Number(sortOrder) || 0,
      })
      // Imagens retiradas nesta edição saem do bucket (best-effort).
      const kept = new Set(images.map((i) => i.path))
      await removeRegionImages((initial?.images ?? []).map((i) => i.path).filter((p) => !kept.has(p))).catch(() => undefined)
      navigate('/painel/regioes')
    } catch (err) {
      const code = (err as { code?: string })?.code
      setError(code === '23505' ? 'Já existe uma região com este endereço de página.' : 'Não foi possível salvar.')
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!initial || !window.confirm(`Excluir a região "${initial.name}"?`)) return
    setBusy(true)
    try {
      await deleteRegion(initial.id)
      await removeRegionImages(initial.images.map((i) => i.path)).catch(() => undefined)
      navigate('/painel/regioes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <div>
        <Link to="/painel/regioes" className="eyebrow text-mute hover:text-ink">← Regiões</Link>
        <h1 className="display mt-3 text-4xl text-ink">{initial ? 'Editar região' : 'Nova região'}</h1>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Nome *">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
        </Field>
        <Field label="Endereço da página *" hint={`/regiao/${slug || '…'}`}>
          <input
            className={inputClass}
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
          />
        </Field>
        <Field label="Subtítulo" hint="Ex.: Condomínio Fazenda da Baronesa" className="sm:col-span-2">
          <input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </Field>
        <Field label="Texto da aba" hint="Não identifique casas específicas." className="sm:col-span-2">
          <textarea className={inputClass} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
        <Field label="Ordem no menu" hint="Menor aparece primeiro.">
          <input className={inputClass} inputMode="numeric" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-4">
        <Check checked={active} onChange={setActive} label="Região ativa" hint="Desativada, some do site e dos formulários." />
        <Check
          checked={showCount}
          onChange={setShowCount}
          label="Mostrar quantidade de imóveis no acervo"
          hint="Exibe o número de imóveis “No acervo” desta região, sem identificar nenhum."
        />
      </div>

      <div>
        <p className="eyebrow text-mute">Imagens (a primeira é a capa)</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <figure key={img.path} className="border border-line">
              <img src={regionImageUrl(img.path)} alt="" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="flex justify-between gap-1 px-2 py-2 text-xs">
                <span className="eyebrow text-[0.58rem] text-gold-soft">{i === 0 ? 'Capa' : ''}</span>
                <span className="flex gap-1">
                  <button type="button" className="h-7 w-7 border border-line disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Mover para trás">←</button>
                  <button type="button" className="h-7 w-7 border border-line disabled:opacity-30" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label="Mover para frente">→</button>
                  <button type="button" className="h-7 w-7 border border-line hover:text-red-700" onClick={() => setImages((c) => c.filter((_, k) => k !== i))} aria-label="Remover imagem">✕</button>
                </span>
              </figcaption>
            </figure>
          ))}
          <label className="flex aspect-[4/3] cursor-pointer items-center justify-center border border-dashed border-line text-mute transition-colors hover:border-gold hover:text-ink">
            <span className="eyebrow">+ Imagens</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                void onUpload(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {initial && (
          <button type="button" disabled={busy} className={dangerButton} onClick={onDelete}>
            Excluir
          </button>
        )}
        <span className="mr-auto" />
        <Link to="/painel/regioes" className={ghostButton}>Cancelar</Link>
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
