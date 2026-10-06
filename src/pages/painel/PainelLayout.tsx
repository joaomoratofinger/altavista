import { useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../lib/auth'
import { isFirebaseConfigured } from '../../lib/firebase'
import Logo from '../../components/Logo'
import Login from './Login'
import { ghostButton, Notice } from './ui'

/**
 * Raiz da área restrita (`/painel/*`). Fica fora do Layout público (sem
 * header/footer/WhatsApp) e só renderiza as telas internas para um admin.
 */
export default function PainelLayout() {
  // Área restrita não deve ser indexada por buscadores.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      {isFirebaseConfigured ? (
        <AuthProvider>
          <Gate />
        </AuthProvider>
      ) : (
        <Shell>
          <Notice>
            O Firebase ainda não está configurado. Copie <strong>.env.example</strong> para{' '}
            <strong>.env</strong>, preencha as chaves do projeto e reinicie o servidor.
          </Notice>
        </Shell>
      )}
    </div>
  )
}

function Gate() {
  const { user, isAdmin, loading, signOut } = useAuth()

  if (loading) {
    return (
      <Shell>
        <p className="text-sm text-mute">Carregando…</p>
      </Shell>
    )
  }

  if (!user) return <Login />

  if (!isAdmin) {
    return (
      <Shell>
        <div className="max-w-xl space-y-5">
          <Notice tone="error">
            A conta <strong>{user.email}</strong> não tem permissão de administrador.
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
      actions={
        <>
          <span className="hidden text-xs text-mute sm:inline">{user.email}</span>
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

function Shell({
  actions,
  children,
}: {
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <>
      <header className="border-b border-line bg-paper-soft">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-6">
            <Logo compact />
            <Link to="/painel" className="eyebrow text-gold-soft">
              Painel
            </Link>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/" className="eyebrow text-mute hover:text-ink">
              Ver site
            </Link>
            {actions}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </>
  )
}
