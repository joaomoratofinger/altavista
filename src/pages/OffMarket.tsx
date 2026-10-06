import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import { SITE, whatsappLink } from '../config'

/**
 * Formulário apenas monta a mensagem e abre o WhatsApp — nenhum dado é
 * gravado em servidor nesta primeira entrega.
 */
export default function OffMarket() {
  const [form, setForm] = useState({
    nome: '',
    contato: '',
    regiao: 'Porto Feliz — SP',
    perfil: '',
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const msg =
      `Lista off market\n` +
      `Nome: ${form.nome}\n` +
      `Contato: ${form.contato}\n` +
      `Região de interesse: ${form.regiao}\n` +
      `Perfil de imóvel: ${form.perfil}`
    window.open(whatsappLink(msg), '_blank', 'noopener')
  }

  return (
    <>
      <PageHeader
        eyebrow="Off Market"
        title="Antes de ir ao mercado"
        subtitle="As melhores oportunidades são negociadas em silêncio. Deixe seu perfil e avisamos quando algo compatível entrar no portfólio."
      />

      <section className="mx-auto max-w-7xl px-5 pb-24 sm:px-8">
        <div className="grid gap-14 md:grid-cols-[1fr_1.1fr]">
          <div className="space-y-6 text-sm leading-relaxed text-mute">
            <p>
              A lista off market é como conectamos proprietários que preferem
              discrição a compradores com um perfil claro de busca.
            </p>
            <ul className="space-y-3">
              {[
                'Seu contato não é compartilhado com terceiros.',
                'Avisamos apenas sobre imóveis dentro do seu perfil.',
                'Sem cadastro em portais, sem anúncio público.',
              ].map((t) => (
                <li key={t} className="border-l border-gold-soft/50 pl-4 text-ink/80">
                  {t}
                </li>
              ))}
            </ul>
            <p>
              Prefere falar direto? {' '}
              <a href={whatsappLink()} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-soft">
                Chame no WhatsApp
              </a>{' '}
              ou escreva para {SITE.email}.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <Field label="Nome">
              <input required value={form.nome} onChange={set('nome')} className={inputCls} />
            </Field>
            <Field label="Telefone ou e-mail">
              <input required value={form.contato} onChange={set('contato')} className={inputCls} />
            </Field>
            <Field label="Região de interesse">
              <select value={form.regiao} onChange={set('regiao')} className={inputCls}>
                <option>Porto Feliz — SP</option>
                <option>Condomínio Fazenda Boa Vista</option>
                <option>Interior de São Paulo</option>
                <option>Portugal</option>
              </select>
            </Field>
            <Field label="Que tipo de imóvel você procura?">
              <textarea
                rows={4}
                value={form.perfil}
                onChange={set('perfil')}
                placeholder="Ex.: fazenda de 10 a 20 alqueires com sede pronta, até R$ 20 mi"
                className={inputCls}
              />
            </Field>
            <button
              type="submit"
              className="eyebrow w-full bg-gold px-6 py-4 text-ink transition-colors hover:bg-gold-soft"
            >
              Enviar pelo WhatsApp
            </button>
          </form>
        </div>
      </section>
    </>
  )
}

const inputCls =
  'w-full border border-line bg-paper-soft px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-gold-soft'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow text-mute">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  )
}
