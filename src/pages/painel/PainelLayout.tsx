import { useEffect, type ReactNode } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../lib/auth'
import { isConfigured } from '../../lib/supabase'
import Logo from '../../components/Logo'
import Login from './Login'
import { ghostButton, Notice } from '../../components/ui'

/**
 * Raiz da área interna (`/painel/*`). Fica fora do Layout público e só mostra
 * as telas para um membro ativo da equipe (tabela `profiles`).
 */
export default function PainelLayout() {
  // Área interna não deve ser indexada por buscadores.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      {isConfigured ? (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      ) : (
        <Shell>
          <Notice>
            O Supabase ainda não está configurado. Copie <strong>.env.example</strong> para{' '}
            <strong>.env</strong>, preencha as chaves do projeto e reinicie o servidor.
          </Notice>
        </Shell>
      )}
    </div>
  )
}

function Gate() {
  const { session, profile, isAdmin, loading, signOut } = useAuth()

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-mute">Carregando…</p>
      </Shell>
    )
  }

  if (!session) return <Login />

  if (!profile) {
    return (
      <Shell>
        <div className="max-w-xl space-y-5">
          <Notice tone="error">
            A conta <strong>{session.user.email}</strong> não tem acesso ao painel. Peça a um
            administrador para liberar seu perfil.
          </Notice>
          <button type="button" onClick={signOut} className={ghostButton}>
            Sair
          </button>
        </div>
      </Shell>
    )
  }

  return (
    <Shell
      links={navLinks(isAdmin)}
      actions={
        <>
          <span className="hidden text-xs text-mute sm:inline">
            {profile.name} · {profile.role === 'admin' ? 'Administrador' : 'Corretor'}
          </span>
          <button type="button" onClick={signOut} className="eyebrow text-mute hover:text-ink">
            Sair
          </button>
        </>
      }
    >
      <Outlet />
    </Shell>
  )
}

interface NavItem {
  to: string
  label: string
  end?: boolean
}

function navLinks(isAdmin: boolean): NavItem[] {
  return [
    { to: '/painel', label: 'Resumo', end: true },
    { to: '/painel/imoveis', label: 'Imóveis' },
    { to: '/painel/compradores', label: 'Compradores' },
    ...(isAdmin
      ? [
          { to: '/painel/regioes', label: 'Regiões' },
          { to: '/painel/termos', label: 'Termos' },
          { to: '/painel/log', label: 'Log' },
        ]
      : []),
  ]
}

function Shell({ links, actions, children }: { links?: NavItem[]; actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <header className="border-b border-line bg-paper-soft">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4 sm:px-8">
          <Logo compact />
          <div className="flex items-center gap-5">
            {actions}
          </div>
          {links && (
            <nav className="-mb-1 flex w-full gap-6 overflow-x-auto pb-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `eyebrow whitespace-nowrap border-b pb-1 transition-colors ${
                      isActive ? 'border-gold text-ink' : 'border-transparent text-mute hover:text-ink'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </>
  )
}
