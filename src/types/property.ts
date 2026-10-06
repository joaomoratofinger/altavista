/**
 * Modelo de dados do imóvel.
 *
 * A separação entre `PropertyPublic` e `PropertyPrivate` é intencional:
 * - `PropertyPublic`  -> tudo que pode aparecer no site.
 * - `PropertyPrivate` -> dados de cadastro que ficam SÓ no painel (login + senha).
 *
 * No Firestore os campos públicos ficam em `properties/{id}` (leitura liberada
 * quando `published`) e os privados na subcoleção `properties/{id}/private/owner`
 * (leitura apenas para admin autenticado — ver `firestore.rules`).
 * Assim o front do site nunca consegue ler o dado do proprietário.
 */

export type PropertyStatus = 'off-market' | 'exclusivo' | 'disponivel' | 'vendido'

export interface PropertyImage {
  url: string
  alt?: string
  /** Caminho no Storage (`properties/{id}/...`); usado para apagar o arquivo. */
  path?: string
}

export interface PropertyPublic {
  id: string
  slug: string
  title: string
  status: PropertyStatus
  /** Ex.: "Porto Feliz — SP" ou "Condomínio Fazenda Boa Vista" */
  location: string
  /** Cidade/estado ou "Portugal" — usado em filtros e nas tags do hero */
  region: string
  /** Preço em BRL. `null` => exibir "Sob consulta". */
  price: number | null
  /** Área construída em m² */
  builtAreaM2?: number
  /** Área do terreno em m² */
  landAreaM2?: number
  /** Área total em alqueires (imóveis rurais) */
  landAlqueires?: number
  bedrooms?: number
  suites?: number
  parking?: number
  /** Texto de apresentação exibido na página do imóvel */
  description?: string
  /** Diferenciais em bullets */
  highlights?: string[]
  images: PropertyImage[]
  /** Controla se aparece na "Seleção atual" da home */
  featured?: boolean
  /** Rascunho (`false`) só é visível no painel; o site só lista `true`. */
  published: boolean
  /** Data ISO `YYYY-MM-DD` */
  createdAt: string
}

export interface PropertyPrivate {
  ownerName: string
  ownerPhone?: string
  ownerEmail?: string
  /** Anotações internas da assessoria */
  internalNotes?: string
  /** Comissão combinada, exclusividade, etc. */
  dealTerms?: string
}

/** Registro completo como fica no painel. Nunca serializado para o site. */
export interface PropertyRecord extends PropertyPublic {
  private: PropertyPrivate
}

export const STATUS_LABELS: Record<PropertyStatus, string> = {
  'off-market': 'Off Market',
  exclusivo: 'Exclusivo',
  disponivel: 'Disponível',
  vendido: 'Vendido',
}
