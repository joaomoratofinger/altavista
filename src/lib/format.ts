const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const num = new Intl.NumberFormat('pt-BR')
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

export const formatPrice = (n: number | null | undefined) => (n == null ? '—' : brl.format(n))
export const formatNumber = (n: number | null | undefined) => (n == null ? '—' : num.format(n))
export const formatArea = (n: number | null | undefined) => (n == null ? '—' : `${num.format(n)} m²`)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatDate = (iso: string) => dateOnly.format(new Date(iso))

/** "5515999998888" -> "+55 (15) 99999-8888" (só para exibição). */
export function formatPhone(digits: string): string {
  const m = digits.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/)
  return m ? `+${m[1]} (${m[2]}) ${m[3]}-${m[4]}` : digits
}

export function formatCpf(digits: string): string {
  const m = digits.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/)
  return m ? `${m[1]}.${m[2]}.${m[3]}-${m[4]}` : digits
}

export const onlyDigits = (s: string) => s.replace(/\D/g, '')

/** "24.500.000" / "12,5" -> número. Vazio -> undefined. Inválido -> NaN. */
export function parseNum(s: string): number | undefined {
  const t = s.trim()
  if (!t) return undefined
  return Number(t.replace(/\./g, '').replace(',', '.'))
}

export function isValidCpf(input: string): boolean {
  const c = onlyDigits(input)
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false
  const digit = (len: number) => {
    let s = 0
    for (let i = 0; i < len; i++) s += Number(c[i]) * (len + 1 - i)
    const d = (s * 10) % 11
    return d === 10 ? 0 : d
  }
  return digit(9) === Number(c[9]) && digit(10) === Number(c[10])
}
