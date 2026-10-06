import { Link } from 'react-router-dom'
import { SITE, whatsappLink } from '../config'

export default function Footer() {
  return (
    <footer className="border-t border-line bg-paper-soft">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="display block text-lg uppercase tracking-[0.14em] text-ink">
              {SITE.name}
            </span>
            <span className="eyebrow mt-1 block text-gold-soft">{SITE.tagline}</span>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mute">
              Assessoria dedicada a propriedades de campo e ativos únicos em Porto Feliz,
              interior de São Paulo e Portugal.
            </p>
          </div>

          <div>
            <p className="eyebrow text-mute">Navegação</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/80">
              <li><Link to="/" className="hover:text-gold">Início</Link></li>
              <li><Link to="/portfolio" className="hover:text-gold">Portfólio</Link></li>
              <li><Link to="/off-market" className="hover:text-gold">Off Market</Link></li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-mute">Contato</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/80">
              <li>
                <a href={whatsappLink()} target="_blank" rel="noreferrer" className="hover:text-gold">
                  WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="hover:text-gold">{SITE.email}</a>
              </li>
              <li>
                <a href={SITE.instagram} target="_blank" rel="noreferrer" className="hover:text-gold">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-mute sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</span>
          <Link to="/painel" className="hover:text-ink">Área restrita</Link>
        </div>
      </div>
    </footer>
  )
}
