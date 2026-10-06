/** Configuração de contato exibida no site. Ajuste conforme os dados reais. */
export const SITE = {
  name: 'Elizeu Almeida',
  tagline: 'Advisory for Iconic Assets',
  /** Telefone só com dígitos e DDI, para o link do WhatsApp */
  whatsapp: '5515999999999',
  whatsappMessage: 'Olá, vim pelo site e gostaria de conversar sobre o portfólio.',
  email: 'contato@elizeualmeida.com.br',
  instagram: 'https://www.instagram.com/elizeualmeida.co/',
  regionsLine: 'Porto Feliz · São Paulo · Portugal',
  /**
   * Retrato do corretor para a seção "Sobre".
   * Deixe como string vazia para exibir o placeholder até receber a foto.
   * Ao ter a imagem: coloque em `public/elizeu.jpg` e troque para '/elizeu.jpg'.
   */
  portrait: '/apartamento-home.jpg',
} as const

export function whatsappLink(message: string = SITE.whatsappMessage): string {
  return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(message)}`
}
