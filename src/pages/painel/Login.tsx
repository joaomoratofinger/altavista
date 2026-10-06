import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authErrorMessage, useAuth } from '../../lib/auth'
import Logo from '../../components/Logo'
import { Field, inputClass, Notice, primaryButton } from './ui'

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(authErrorMessage(err))
      setBusy(false)
    }
    // Em caso de sucesso o AuthProvider troca a tela; nada a fazer aqui.
  }

  async function onReset() {
    if (!email.trim()) {
      setError('Digite seu e-mail para receber o link de redefinição.')
      return
    }
    setError(null)
    try {
      await resetPassword(email)
    } catch {
      // Resposta neutra: não revela se o e-mail existe.
    }
    setInfo('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-block text-left">
            <Logo />
          </div>
          <p className="eyebrow mt-8 text-gold-soft">Área restrita</p>
        </div>

        <Field label="E-mail">
          <input
            type="email"
            required
            autoFocus
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
        {info && <Notice>{info}</Notice>}

        <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="flex justify-between text-xs text-mute">
          <button type="button" onClick={onReset} className="hover:text-ink">
            Esqueci minha senha
          </button>
          <Link to="/" className="hover:text-ink">
            ← Voltar ao site
          </Link>
        </div>
      </form>
    </div>
  )
}
