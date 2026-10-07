import { useState, type FormEvent } from 'react'
import { useAuth } from '../../lib/auth'
import Logo from '../../components/Logo'
import { Field, inputClass, Notice, primaryButton } from '../../components/ui'

/** Tela exibida depois que a pessoa abre o link de redefinição recebido por e-mail. */
export default function SetPassword() {
  const { updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Use ao menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updatePassword(password)
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? ''
      setError(
        /different from the old password/i.test(msg)
          ? 'Escolha uma senha diferente da anterior.'
          : 'Não foi possível salvar a senha. O link pode ter expirado: peça um novo em “Esqueci minha senha”.',
      )
      setBusy(false)
    }
    // Sucesso: o AuthProvider sai do modo de redefinição e o painel abre.
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-block text-left">
            <Logo />
          </div>
          <p className="eyebrow mt-8 text-gold-soft">Definir nova senha</p>
        </div>

        <Field label="Nova senha" hint="Mínimo de 8 caracteres.">
          <input
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Repita a nova senha">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </Field>

        {error && <Notice tone="error">{error}</Notice>}

        <button type="submit" disabled={busy} className={`${primaryButton} w-full`}>
          {busy ? 'Salvando…' : 'Salvar senha e entrar'}
        </button>
      </form>
    </div>
  )
}
