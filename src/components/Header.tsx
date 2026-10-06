import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import { SITE, whatsappLink } from '../config'

const NAV = [
  { to: '/', label: 'Início', end: true },
  { to: '/portfolio', label: 'Portfólio', end: false },
  { to: '/off-market', label: 'Off Market', end: false },
]

export default function Header() {
  const { pathname } = useLocation()
  const hasHero = pathname === '/'
  const [scrolled, setScrolled] = useState(!hasHero)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!hasHero) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [hasHero])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const solid = scrolled || open

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid
          ? 'bg-paper/95 backdrop-blur border-b border-line'
          : 'bg-gradient-to-b from-ink/55 to-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo theme={solid ? 'ink' : 'bone'} />

        <nav className="hidden items-center gap-9 md:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `eyebrow transition-colors hover:text-gold ${
                  solid
                    ? isActive ? 'text-ink' : 'text-ink/70'
                    : isActive ? 'text-bone' : 'text-bone/80'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            className="eyebrow border border-gold-soft/60 px-5 py-2.5 text-gold transition-colors hover:bg-gold hover:text-paper"
          >
            WhatsApp
          </a>
        </nav>

        <button
          type="button"
          className={`md:hidden transition-colors ${solid ? 'text-ink' : 'text-bone'}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line bg-paper px-5 pb-10 pt-4 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block border-b border-line py-4 text-lg display ${
                  isActive ? 'text-gold' : 'text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer"
            className="mt-6 block border border-gold-soft/60 py-3 text-center text-gold eyebrow"
          >
            Falar no WhatsApp
          </a>
          <p className="eyebrow mt-6 text-mute">{SITE.regionsLine}</p>
        </nav>
      )}
    </header>
  )
}
