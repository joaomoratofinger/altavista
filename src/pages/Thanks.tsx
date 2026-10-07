import { Link, useSearchParams } from 'react-router-dom'

export default function Thanks() {
  const [params] = useSearchParams()
  const owner = params.get('tipo') === 'proprietario'

  return (
    <div className="mx-auto max-w-2xl px-5 pb-24 pt-44 sm:px-8">
      <p className="eyebrow text-gold-soft">Cadastro recebido</p>
      <h1 className="display mt-4 text-4xl text-ink sm:text-5xl">Obrigado.</h1>
      <p className="mt-6 text-sm leading-relaxed text-ink/75">
        {owner
          ? 'Recebemos o cadastro do seu imóvel. Nossa equipe fará a análise e entrará em contato pelo WhatsApp informado. Até lá, ele permanece em sigilo.'
          : 'Recebemos o seu cadastro. Ele passa por aprovação manual da nossa equipe; assim que aprovado, você receberá uma mensagem no WhatsApp com o acesso.'}
      </p>
      <Link to="/" className="eyebrow mt-8 inline-block text-gold hover:text-gold-soft">
        ← Voltar ao início
      </Link>
    </div>
  )
}
