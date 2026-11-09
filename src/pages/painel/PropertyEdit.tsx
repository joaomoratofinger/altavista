import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAsync } from '../../lib/useAsync'
import { getProperty, listAllRegions, updatePropertyDetails } from '../../data/admin'
import { parseNum } from '../../lib/format'
import type { Property } from '../../types/db'
import { Check, Field, ghostButton, inputClass, Notice, NumField, primaryButton } from '../../components/ui'

/** Correção dos dados de um imóvel do acervo pela equipe (ex.: valor digitado errado). */
export default function PropertyEdit() {
  const { id = '' } = useParams()
  const { data, loading, error } = useAsync(() => getProperty(id), [id])
  if (loading) return <p className="text-sm text-mute">Carregando…</p>
  if (error) return <Notice tone="error">Não foi possível carregar o imóvel.</Notice>
  if (!data) return <Notice>Imóvel não encontrado.</Notice>
  return <EditForm property={data.property} />
}

const numText = (n: number | null) => (n == null ? '' : String(n))

function EditForm({ property: p }: { property: Property }) {
  const navigate = useNavigate()
  const { data: regions } = useAsync(listAllRegions, [])
  const [regionId, setRegionId] = useState(p.region_id)
  const [location, setLocation] = useState(p.location_detail)
  const [land, setLand] = useState(numText(p.land_area_m2))
  const [built, setBuilt] = useState(numText(p.built_area_m2))
  const [price, setPrice] = useState(numText(p.asking_price))
  const [bedrooms, setBedrooms] = useState(numText(p.bedrooms))
  const [suites, setSuites] = useState(numText(p.suites))
  const [parking, setParking] = useState(numText(p.parking))
  const [highlights, setHighlights] = useState(p.highlights ?? '')
  const [accepts, setAccepts] = useState(p.accepts_buyer_contact)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Vazio -> null; texto inválido ou negativo -> undefined (erro). */
  function num(s: string): number | null | undefined {
    const n = parseNum(s)
    if (n === undefined) return null
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (location.trim().length < 2) {
      setError('Informe o condomínio ou bairro.')
      return
    }
    const v = [land, built, price, bedrooms, suites, parking].map(num)
    if (v.some((x) => x === undefined)) {
      setError('Valor, áreas e quantidades precisam ser números.')
      return
    }
    const [vLand, vBuilt, vPrice, vBed, vSuites, vParking] = v as Array<number | null>
    const int = (n: number | null) => (n == null ? null : Math.round(n))
    setBusy(true)
    setError(null)
    try {
      await updatePropertyDetails(p.id, {
        region_id: regionId,
        location_detail: location.trim(),
        land_area_m2: vLand,
        built_area_m2: vBuilt,
        asking_price: vPrice,
        bedrooms: int(vBed),
        suites: int(vSuites),
        parking: int(vParking),
        highlights: highlights.trim() || null,
        accepts_buyer_contact: accepts,
      })
      navigate(`/painel/imoveis/${p.id}`)
    } catch {
      setError('Não foi possível salvar.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-10">
      <div>
        <Link to={`/painel/imoveis/${p.id}`} className="eyebrow text-mute hover:text-ink">← Voltar ao imóvel</Link>
        <h1 className="display mt-3 text-4xl text-ink">Editar dados</h1>
        <p className="mt-3 text-sm text-mute">
          Use para corrigir informações combinadas com o proprietário. O status do imóvel não muda ao salvar.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Região">
          <select className={inputClass} value={regionId} onChange={(e) => setRegionId(e.target.value)}>
            {regions?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Condomínio / bairro *">
          <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
        </Field>
        <NumField label="Valor pretendido (R$)" value={price} onChange={setPrice} />
        <NumField label="Terreno (m²)" value={land} onChange={setLand} />
        <NumField label="Área construída (m²)" value={built} onChange={setBuilt} />
        <NumField label="Quartos" value={bedrooms} onChange={setBedrooms} />
        <NumField label="Suítes" value={suites} onChange={setSuites} />
        <NumField label="Vagas" value={parking} onChange={setParking} />
        <Field label="Diferenciais" className="sm:col-span-2">
          <textarea className={inputClass} rows={8} value={highlights} onChange={(e) => setHighlights(e.target.value)} />
        </Field>
      </div>

      <Check checked={accepts} onChange={setAccepts} label="Aceita contato de compradores" />

      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-6">
        <Link to={`/painel/imoveis/${p.id}`} className={ghostButton}>Cancelar</Link>
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}
