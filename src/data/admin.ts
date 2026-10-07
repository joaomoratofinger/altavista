import { BUCKET_PRIVATE, BUCKET_REGIONS, supabase } from '../lib/supabase'
import { extensionFor, shrinkImage } from '../lib/images'
import type {
  AccessLogRow,
  Buyer,
  BuyerStatus,
  Counters,
  Interaction,
  Owner,
  Property,
  PropertyMedia,
  PropertyStatus,
  Region,
  Term,
  TermKind,
} from '../types/db'

/** Acesso do PAINEL. Todas as leituras/escritas dependem das políticas (RLS) do banco. */

function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}

/** Registra no log de acessos (falha silenciosa: não deve travar o painel). */
export function logAccess(action: string, entity: string, entityId?: string, detail?: object) {
  void supabase
    .rpc('log_access', {
      p_action: action,
      p_entity: entity,
      p_entity_id: entityId ?? null,
      p_detail: detail ?? null,
    })
    .then(() => undefined)
}

export async function getCounters(): Promise<Counters> {
  return check(await supabase.rpc('dashboard_counters')) as Counters
}

// ---------------------------------------------------------------------------
// Imóveis
// ---------------------------------------------------------------------------

export type PropertyRow = Property & { owner: Owner | null; region: Pick<Region, 'id' | 'name'> | null }

export async function listProperties(status?: PropertyStatus): Promise<PropertyRow[]> {
  let q = supabase
    .from('properties')
    .select('*, owner:owners(*), region:regions(id, name)')
    .order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  return check(await q) as unknown as PropertyRow[]
}

export async function getProperty(id: string): Promise<{ property: PropertyRow; media: PropertyMedia[] } | null> {
  const { data, error } = await supabase
    .from('properties')
    .select('*, owner:owners(*), region:regions(id, name)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const media = check(
    await supabase.from('property_media').select('*').eq('property_id', id).order('position'),
  ) as PropertyMedia[]
  logAccess('ver', 'properties', id)
  return { property: data as unknown as PropertyRow, media }
}

export async function setPropertyStatus(id: string, status: PropertyStatus, note?: string): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({ status, review_note: note?.trim() || null })
    .eq('id', id)
  if (error) throw error
}

/** Links temporários (1 h) para as fotos do bucket privado. */
export async function signedMediaUrls(paths: string[], seconds = 3600): Promise<Record<string, string>> {
  if (paths.length === 0) return {}
  const { data, error } = await supabase.storage.from(BUCKET_PRIVATE).createSignedUrls(paths, seconds)
  if (error) throw error
  const out: Record<string, string> = {}
  for (const row of data) if (row.path && row.signedUrl) out[row.path] = row.signedUrl
  return out
}

export async function deleteProperty(id: string, media: PropertyMedia[]): Promise<void> {
  if (media.length) await supabase.storage.from(BUCKET_PRIVATE).remove(media.map((m) => m.path))
  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) throw error
  logAccess('excluir', 'properties', id)
}

/** LGPD: apaga o proprietário e todos os imóveis/arquivos dele. */
export async function deleteOwner(ownerId: string): Promise<void> {
  const props = check(await supabase.from('properties').select('id').eq('owner_id', ownerId)) as Array<{ id: string }>
  if (props.length) {
    const media = check(
      await supabase.from('property_media').select('path').in('property_id', props.map((p) => p.id)),
    ) as Array<{ path: string }>
    if (media.length) await supabase.storage.from(BUCKET_PRIVATE).remove(media.map((m) => m.path))
  }
  const { error } = await supabase.from('owners').delete().eq('id', ownerId)
  if (error) throw error
  logAccess('excluir', 'owners', ownerId)
}

export async function compatibleBuyers(propertyId: string): Promise<Buyer[]> {
  return check(await supabase.rpc('compatible_buyers', { p_property: propertyId })) as Buyer[]
}

// ---------------------------------------------------------------------------
// Compradores
// ---------------------------------------------------------------------------

export async function listBuyers(status?: BuyerStatus): Promise<Buyer[]> {
  let q = supabase.from('buyers').select('*').order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  return check(await q) as Buyer[]
}

export async function getBuyer(id: string): Promise<Buyer | null> {
  const { data, error } = await supabase.from('buyers').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (data) logAccess('ver', 'buyers', id)
  return data as Buyer | null
}

export async function setBuyerStatus(id: string, status: BuyerStatus, note?: string): Promise<void> {
  const { error } = await supabase
    .from('buyers')
    .update({ status, review_note: note?.trim() || null })
    .eq('id', id)
  if (error) throw error
}

export async function compatibleProperties(buyerId: string): Promise<Property[]> {
  return check(await supabase.rpc('compatible_properties', { p_buyer: buyerId })) as Property[]
}

export async function listInteractions(buyerId: string): Promise<Interaction[]> {
  return check(
    await supabase.from('interactions').select('*').eq('buyer_id', buyerId).order('created_at'),
  ) as Interaction[]
}

export async function addTeamNote(buyerId: string, message: string, propertyId?: string): Promise<void> {
  const { error } = await supabase.from('interactions').insert({
    buyer_id: buyerId,
    property_id: propertyId ?? null,
    direction: 'equipe',
    message,
  })
  if (error) throw error
}

export async function deleteBuyer(id: string): Promise<void> {
  const { error } = await supabase.from('buyers').delete().eq('id', id)
  if (error) throw error
  logAccess('excluir', 'buyers', id)
}

// ---------------------------------------------------------------------------
// Regiões (administrador)
// ---------------------------------------------------------------------------

export async function listAllRegions(): Promise<Region[]> {
  return check(await supabase.from('regions').select('*').order('sort_order').order('name')) as Region[]
}

export async function getRegion(id: string): Promise<Region | null> {
  const { data, error } = await supabase.from('regions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data as Region | null
}

export type RegionInput = Omit<Region, 'id'> & { id?: string }

export async function saveRegion(region: RegionInput): Promise<string> {
  const { id, ...fields } = region
  if (id) {
    const { error } = await supabase.from('regions').update(fields).eq('id', id)
    if (error) throw error
    return id
  }
  const { data, error } = await supabase.from('regions').insert(fields).select('id').single()
  if (error) throw error
  return (data as { id: string }).id
}

export async function deleteRegion(id: string): Promise<void> {
  const { error } = await supabase.from('regions').delete().eq('id', id)
  if (error) {
    if ((error as { code?: string }).code === '23503') {
      throw new Error('Esta região já tem imóveis cadastrados. Desative-a em vez de excluir.')
    }
    throw error
  }
}

export async function uploadRegionImage(file: File): Promise<string> {
  const blob = await shrinkImage(file)
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${extensionFor(blob, file)}`
  const { error } = await supabase.storage
    .from(BUCKET_REGIONS)
    .upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' })
  if (error) throw error
  return path
}

export async function removeRegionImages(paths: string[]): Promise<void> {
  if (paths.length) await supabase.storage.from(BUCKET_REGIONS).remove(paths)
}

// ---------------------------------------------------------------------------
// Termos e log (administrador)
// ---------------------------------------------------------------------------

export async function listTerms(): Promise<Term[]> {
  return check(
    await supabase.from('terms').select('*').order('kind').order('version', { ascending: false }),
  ) as Term[]
}

/** Publica uma nova versão do termo e a torna a vigente. */
export async function publishTerm(kind: TermKind, body: string): Promise<void> {
  const { error } = await supabase.rpc('publish_term', { p_kind: kind, p_body: body })
  if (error) throw error
}

export async function listAccessLog(limit = 200): Promise<Array<AccessLogRow & { user: { name: string } | null }>> {
  return check(
    await supabase
      .from('access_log')
      .select('*, user:profiles(name)')
      .order('at', { ascending: false })
      .limit(limit),
  ) as unknown as Array<AccessLogRow & { user: { name: string } | null }>
}

// ---------------------------------------------------------------------------
// Exportação
// ---------------------------------------------------------------------------

export async function exportPropertiesRows(): Promise<{ header: string[]; rows: Array<Array<string | number | boolean | null>> }> {
  const list = await listProperties()
  logAccess('exportar', 'properties', undefined, { linhas: list.length })
  return {
    header: [
      'Cadastro', 'Status', 'Região', 'Condomínio/bairro', 'Terreno m²', 'Construída m²', 'Quartos',
      'Suítes', 'Vagas', 'Valor pretendido', 'Aceita contato de compradores',
      'Proprietário', 'WhatsApp', 'E-mail', 'Diferenciais',
    ],
    rows: list.map((p) => [
      p.created_at.slice(0, 10), p.status, p.region?.name ?? '', p.location_detail, p.land_area_m2,
      p.built_area_m2, p.bedrooms, p.suites, p.parking, p.asking_price, p.accepts_buyer_contact,
      p.owner?.name ?? '', p.owner?.whatsapp ?? '', p.owner?.email ?? '', p.highlights,
    ]),
  }
}

export async function exportBuyersRows(): Promise<{ header: string[]; rows: Array<Array<string | number | boolean | null>> }> {
  const [list, regions] = await Promise.all([listBuyers(), listAllRegions()])
  const names = new Map(regions.map((r) => [r.id, r.name]))
  logAccess('exportar', 'buyers', undefined, { linhas: list.length })
  return {
    header: ['Cadastro', 'Status', 'Nome', 'CPF', 'WhatsApp', 'E-mail', 'Tipo', 'Regiões', 'Valor mínimo', 'Valor máximo', 'Perfil do imóvel'],
    rows: list.map((b) => [
      b.created_at.slice(0, 10), b.status, b.name, b.cpf, b.whatsapp, b.email, b.kind,
      b.region_ids.map((id) => names.get(id) ?? id).join(', '), b.price_min, b.price_max, b.property_profile,
    ]),
  }
}
