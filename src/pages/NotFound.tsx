import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 pt-44 sm:px-8">
      <p className="eyebrow text-gold-soft">404</p>
      <h1 className="display mt-4 text-4xl text-ink">Página não encontrada</h1>
      <Link to="/" className="eyebrow mt-6 inline-block text-gold hover:text-gold-soft">
        ← Voltar ao início
      </Link>
    </div>
  )
}
