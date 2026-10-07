import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isConfigured } from './supabase'
import type { Profile } from '../types/db'

interface AuthValue {
  session: Session | null
  /** Perfil ativo da equipe. `null` = logado mas sem permissão (ou deslogado). */
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isConfigured)

  useEffect(() => {
    if (!isConfigured) return
    let active = true

    async function load(s: Session | null) {
      setSession(s)
      if (!s) {
        setProfile(null)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, name, role, active')
        .eq('id', s.user.id)
        .maybeSingle()
      if (!active) return
      setProfile(data && data.active ? (data as Profile) : null)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => load(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Fora do callback: chamar o Supabase aqui dentro pode travar a sessão.
      setTimeout(() => load(s), 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value: AuthValue = {
    session,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signIn: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
    },
    signOut: async () => {
      await supabase.auth.signOut()
    },
    resetPassword: async (email) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/painel`,
      })
      if (error) throw error
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

/** Traduz erros do Supabase Auth para mensagens em português. */
export function authErrorMessage(error: unknown): string {
  const e = error as { code?: string; message?: string; status?: number }
  if (e?.code === 'invalid_credentials' || e?.message === 'Invalid login credentials') {
    return 'E-mail ou senha incorretos.'
  }
  if (e?.code === 'over_request_rate_limit' || e?.status === 429) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
  }
  if (e?.message === 'Failed to fetch') return 'Sem conexão. Verifique a internet e tente novamente.'
  return 'Não foi possível entrar. Tente novamente.'
}
