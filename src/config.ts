/** Configuração de marca e contato. Ajuste conforme os dados reais. */
export const SITE = {
  name: 'Altavista Residences',
  tagline: 'Acervo off market',
  /** Telefone só com dígitos e DDI, para o link do WhatsApp (PLACEHOLDER) */
  whatsapp: '5515999999999',
  whatsappMessage: 'Olá, vim pelo site e gostaria de falar com a equipe.',
  email: 'contato@altavistaresidences.com.br',
} as const

export function whatsappLink(message: string = SITE.whatsappMessage): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`
}
