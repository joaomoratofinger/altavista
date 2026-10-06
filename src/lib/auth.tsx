import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

interface AuthValue {
  user: User | null
  /** Tem documento em `admins/{uid}` — é o que as regras do Firestore exigem. */
  isAdmin: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(Boolean(auth))

  useEffect(() => {
    if (!auth || !db) return
    const firestore = db
    return onAuthStateChanged(auth, async (u) => {
      setLoading(true)
      setUser(u)
      let admin = false
      if (u) {
        try {
          admin = (await getDoc(doc(firestore, 'admins', u.uid))).exists()
        } catch {
          admin = false
        }
      }
      setIsAdmin(admin)
      setLoading(false)
    })
  }, [])

  const value: AuthValue = {
    user,
    isAdmin,
    loading,
    signIn: async (email, password) => {
      if (!auth) throw new Error('Firebase não configurado.')
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },
    signOut: async () => {
      if (auth) await fbSignOut(auth)
    },
    resetPassword: async (email) => {
      if (!auth) throw new Error('Firebase não configurado.')
      await sendPasswordResetEmail(auth, email.trim())
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

/** Traduz códigos de erro do Firebase Auth para mensagens em português. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou senha incorretos.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão. Verifique a internet e tente novamente.'
    default:
      return 'Não foi possível entrar. Tente novamente.'
  }
}
