export type Role = 'admin' | 'corretor'

export interface Profile {
  id: string
  name: string
  role: Role
  active: boolean
}

export interface RegionImage {
  path: string
  alt?: string
}

export interface Region {
  id: string
  slug: string
  name: string
  subtitle: string | null
  body: string | null
  images: RegionImage[]
  show_count: boolean
  active: boolean
  sort_order: number
}

export type TermKind = 'proprietario' | 'comprador'

export interface Term {
  id: string
  kind: TermKind
  version: number
  body: string
  active: boolean
  created_at: string
}

export type PropertyStatus =
  | 'em_analise'
  | 'ajuste_solicitado'
  | 'recusado'
  | 'no_acervo'
  | 'vendido'
  | 'pausado'

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  em_analise: 'Em análise',
  ajuste_solicitado: 'Ajuste solicitado',
  recusado: 'Recusado',
  no_acervo: 'No acervo',
  vendido: 'Vendido',
  pausado: 'Pausado',
}

export interface Owner {
  id: string
  name: string
  whatsapp: string
  email: string
  terms_version: number
  terms_accepted_at: string
  created_at: string
}

export interface Property {
  id: string
  owner_id: string
  region_id: string
  location_detail: string
  land_area_m2: number | null
  built_area_m2: number | null
  bedrooms: number | null
  suites: number | null
  parking: number | null
  highlights: string | null
  asking_price: number | null
  accepts_buyer_contact: boolean
  status: PropertyStatus
  review_note: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type MediaKind = 'foto' | 'planta' | 'video'

export interface PropertyMedia {
  id: string
  property_id: string
  path: string
  kind: MediaKind
  position: number
}

export type BuyerStatus = 'aguardando' | 'aprovado' | 'recusado'

export const BUYER_STATUS_LABELS: Record<BuyerStatus, string> = {
  aguardando: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
}

export type BuyerKind = 'corretor' | 'final'

export interface Buyer {
  id: string
  name: string
  cpf: string
  whatsapp: string
  email: string
  region_ids: string[]
  price_min: number | null
  price_max: number | null
  property_profile: string | null
  kind: BuyerKind
  status: BuyerStatus
  review_note: string | null
  reviewed_at: string | null
  terms_version: number
  terms_accepted_at: string
  created_at: string
}

export interface Interaction {
  id: string
  buyer_id: string
  property_id: string | null
  direction: 'comprador' | 'agente' | 'equipe'
  message: string | null
  photos_sent: unknown[]
  handed_to_human: boolean
  created_at: string
}

export interface AccessLogRow {
  id: number
  user_id: string | null
  action: string
  entity: string
  entity_id: string | null
  detail: Record<string, unknown> | null
  at: string
}

export interface Counters {
  properties: Partial<Record<PropertyStatus, number>>
  buyers: Partial<Record<BuyerStatus, number>>
  signups: Array<{ day: string; proprietarios: number; compradores: number }>
}
