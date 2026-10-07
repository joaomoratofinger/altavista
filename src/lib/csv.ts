/** CSV com `;` e BOM: o Excel brasileiro abre direto, com acentos corretos. */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number | boolean | null | undefined>>) {
  const cell = (v: string | number | boolean | null | undefined) => {
    let s = v == null ? '' : String(v)
    // Evita que o Excel execute células iniciadas por = + - @ (injeção de fórmula).
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
