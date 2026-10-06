import type { PropertyPublic } from '../types/property'

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('pt-BR')

export function formatPrice(price: number | null): string {
  return price == null ? 'Sob consulta' : brl.format(price)
}

/** Linha curta de specs para os cards: "1.100 m²  ·  6 suítes  ·  12 alq." */
export function specLine(p: PropertyPublic): string {
  const parts: string[] = []
  if (p.builtAreaM2) parts.push(`${num.format(p.builtAreaM2)} m²`)
  else if (p.landAreaM2) parts.push(`${num.format(p.landAreaM2)} m²`)
  if (p.suites) parts.push(`${p.suites} suíte${p.suites > 1 ? 's' : ''}`)
  else if (p.bedrooms) parts.push(`${p.bedrooms} dorm.`)
  if (p.landAlqueires) parts.push(`${num.format(p.landAlqueires)} alq.`)
  return parts.join('  ·  ')
}

export function formatArea(m2?: number): string | null {
  return m2 ? `${num.format(m2)} m²` : null
}
