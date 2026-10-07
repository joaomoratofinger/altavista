import { BUCKET_PRIVATE, BUCKET_REGIONS, supabase } from '../lib/supabase'
import { extensionFor, shrinkImage } from '../lib/images'
import type { MediaKind, Region, Term, TermKind } from '../types/db'

/**
 * Acesso PÚBLICO (visitantes): regiões ativas, termos ativos, contagens e os
 * dois cadastros. Nada aqui lê imóveis, proprietários ou compradores — as
 * políticas do banco só permitem isso à equipe.
 */

export function regionImageUrl(path: string): string {
  return supabase.storage.from(BUCKET_REGIONS).getPublicUrl(path).data.publicUrl
}

export async function listRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('active', true)
    .order('sort_order')
    .order('name')
  if (error) throw error
  return data as Region[]
}

export async function getRegionBySlug(slug: string): Promise<Region | null> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data as Region | null
}

/** { regionId: quantidade } só das regiões que a equipe decidiu exibir. */
export async function getRegionCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('region_public_counts')
  if (error) throw error
  return Object.fromEntries((data as Array<{ region_id: string; total: number }>).map((r) => [r.region_id, r.total]))
}

export async function getActiveTerm(kind: TermKind): Promise<Term | null> {
  const { data, error } = await supabase
    .from('terms')
    .select('*')
    .eq('kind', kind)
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data as Term | null
}

// ---------------------------------------------------------------------------
// Cadastro do proprietário
// ---------------------------------------------------------------------------

export interface OwnerMediaFile {
  file: File
  kind: MediaKind
}

export interface OwnerSubmission {
  name: string
  whatsapp: string
  email: string
  region_id: string
  location_detail: string
  land_area_m2?: number
  built_area_m2?: number
  bedrooms?: number
  suites?: number
  parking?: number
  highlights?: string
  asking_price?: number
  accepts_buyer_contact: boolean
  terms_accepted: boolean
}

/**
 * Envia os arquivos para `incoming/{submissionId}/…` (bucket privado: visitante
 * só consegue enviar, nunca ler) e depois grava o cadastro numa única chamada.
 */
export async function submitOwner(
  data: OwnerSubmission,
  files: OwnerMediaFile[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const submissionId = crypto.randomUUID()
  const uploaded: Array<{ path: string; kind: MediaKind }> = new Array(files.length)
  let done = 0

  // Sobe 3 arquivos por vez; qualquer falha interrompe o cadastro inteiro.
  let next = 0
  async function worker() {
    while (next < files.length) {
      const i = next++
      const { file, kind } = files[i]
      const blob = kind === 'foto' ? await shrinkImage(file) : file
      const path = `incoming/${submissionId}/${String(i).padStart(2, '0')}-${crypto.randomUUID().slice(0, 8)}.${extensionFor(blob, file)}`
      const { error } = await supabase.storage
        .from(BUCKET_PRIVATE)
        .upload(path, blob, { contentType: blob.type || file.type, upsert: false })
      if (error) throw error
      uploaded[i] = { path, kind }
      onProgress?.(++done, files.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(3, files.length) }, worker))

  const { error } = await supabase.rpc('submit_owner', {
    p: { ...data, submission_id: submissionId, media: uploaded },
  })
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Cadastro do comprador
// ---------------------------------------------------------------------------

export interface BuyerSubmission {
  name: string
  cpf: string
  whatsapp: string
  email: string
  region_ids: string[]
  price_min?: number
  price_max?: number
  property_profile?: string
  kind: 'corretor' | 'final'
  terms_accepted: boolean
}

export async function submitBuyer(data: BuyerSubmission): Promise<void> {
  const { error } = await supabase.rpc('submit_buyer', { p: data })
  if (error) throw error
}

/** Mensagens `raise exception` do banco são em português e seguras para exibir. */
export function submissionErrorMessage(error: unknown): string {
  const msg = (error as { message?: string })?.message ?? ''
  const known = [
    'Nome inválido', 'WhatsApp inválido', 'E-mail inválido', 'CPF inválido', 'Região inválida',
    'É necessário aceitar', 'Informe', 'Envie ao menos', 'Máximo de 30', 'Faixa de valor inválida',
    'Muitas solicitações', 'Termo indisponível',
  ]
  if (known.some((k) => msg.startsWith(k))) return msg
  if (msg === 'Failed to fetch') return 'Sem conexão. Verifique a internet e tente novamente.'
  return 'Não foi possível enviar agora. Tente novamente em instantes.'
}
