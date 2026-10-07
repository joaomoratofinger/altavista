import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Logo from './Logo'
import { useAsync } from '../lib/useAsync'
import { isConfigured } from '../lib/supabase'
import { listRegions } from '../data/site'

export default function Header() {
  const { pathname } = useLocation()
  const hasHero = pathname === '/'
  const [scrolled, setScrolled] = useState(!hasHero)
  const [open, setOpen] = useState(false)
  // As abas vêm do banco: nova região no painel aparece aqui sem deploy.
  const { data: regions } = useAsync(() => (isConfigured ? listRegions() : Promise.resolve([])), [])

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
  const items = (regions ?? []).map((r) => ({ to: `/regiao/${r.slug}`, label: r.name }))

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? 'border-b border-line bg-paper/95 backdrop-blur' : 'bg-gradient-to-b from-ink/80 via-ink/40 to-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
        <Logo theme={solid ? 'ink' : 'bone'} />

        <nav className="hidden items-center gap-8 lg:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `eyebrow transition-colors hover:text-gold ${
                  solid ? (isActive ? 'text-ink' : 'text-ink/70') : isActive ? 'text-bone' : 'text-bone/80'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/comprador"
            className={`eyebrow border px-5 py-2.5 transition-colors ${
              solid
                ? 'border-gold-soft/60 text-gold hover:bg-gold hover:text-paper'
                : 'border-bone/70 text-bone hover:bg-bone hover:text-ink'
            }`}
          >
            Quero comprar
          </Link>
          <Link
            to="/proprietario"
            className="eyebrow bg-gold px-5 py-2.5 text-ink transition-colors hover:bg-gold-soft hover:text-bone"
          >
            Sou proprietário
          </Link>
        </nav>

        <button
          type="button"
          className={`lg:hidden transition-colors ${solid ? 'text-ink' : 'text-bone'}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-line bg-paper px-5 pb-10 pt-4 lg:hidden">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `display block border-b border-line py-4 text-lg ${isActive ? 'text-gold' : 'text-ink'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/proprietario"
            onClick={() => setOpen(false)}
            className="eyebrow mt-6 block bg-gold py-3.5 text-center text-ink"
          >
            Sou proprietário
          </Link>
          <Link
            to="/comprador"
            onClick={() => setOpen(false)}
            className="eyebrow mt-3 block border border-gold-soft/60 py-3.5 text-center text-gold"
          >
            Quero comprar
          </Link>
        </nav>
      )}
    </header>
  )
}
