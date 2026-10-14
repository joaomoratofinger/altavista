import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { authErrorMessage, useAuth } from '../lib/auth'
import { isConfigured } from '../lib/supabase'
import { Field, inputClass, Notice, primaryButton } from '../components/ui'

/** Login do comprador aprovado (e-mail e senha criados pela equipe). */
export default function Entrar() {
  const { session, signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && session) return <Navigate to="/acervo" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
    // Com sucesso a sessão muda e o <Navigate> acima leva ao acervo.
  }

  return (
    <div className="mx-auto max-w-md px-5 pb-24 pt-36 sm:pt-44">
      <p className="eyebrow text-gold-soft">Área do cliente</p>
      <h1 className="display mt-4 text-4xl text-ink">Entrar</h1>
      <p className="mt-4 text-sm leading-relaxed text-mute">
        Use o e-mail e a senha enviados pela nossa equipe após a aprovação do seu cadastro.
      </p>

      {!isConfigured && (
        <div className="mt-8">
          <Notice>O acesso estará disponível assim que o banco de dados for configurado.</Notice>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <Field label="E-mail">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Senha">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <button type="submit" disabled={busy || !isConfigured} className={`${primaryButton} w-full`}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="text-xs text-mute">Esqueceu a senha? Fale com a nossa equipe para receber uma nova.</p>
      </form>
    </div>
  )
}
