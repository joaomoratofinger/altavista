import { Link } from 'react-router-dom'
import { SITE, whatsappLink } from '../config'

export default function Footer() {
  return (
    <footer className="mt-8 rounded-t-3xl border-t border-line bg-paper-soft">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="display block text-lg uppercase tracking-[0.14em] text-ink">{SITE.name}</span>
            <span className="eyebrow mt-1 block text-gold-soft">{SITE.tagline}</span>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-mute">
              Casas de alto padrão que não estão à venda, apresentadas apenas a compradores
              cadastrados e aprovados.
            </p>
          </div>

          <div>
            <p className="eyebrow text-mute">Cadastro</p>
            <ul className="mt-4 space-y-2 text-sm text-ink/80">
              <li><Link to="/proprietario" className="hover:text-gold">Sou proprietário</Link></li>
              <li><Link to="/comprador" className="hover:text-gold">Quero comprar</Link></li>
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
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-line pt-6 text-xs text-mute sm:flex-row">
          <span>© {new Date().getFullYear()} {SITE.name}. Todos os direitos reservados.</span>
          <Link to="/painel" className="hover:text-ink">Área da equipe</Link>
        </div>
      </div>
    </footer>
  )
}
