import { SITE } from '../config'

const STATS = [
  { value: '+180', label: 'Propriedades no portfólio' },
  { value: '2', label: 'Países de atuação' },
  { value: '100%', label: 'Atendimento pessoal' },
]

export default function AboutElizeu() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
      <div className="grid gap-12 md:grid-cols-[minmax(0,0.85fr)_1fr] md:items-center md:gap-16">
        {/* Retrato */}
        <div className="aspect-[3/4] w-full overflow-hidden bg-card">
          {SITE.portrait ? (
            <img
              src={SITE.portrait}
              alt={`${SITE.name}, corretor especialista em casas de campo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center px-6 text-center"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(135deg, #ece3d3 0 8px, #f1ebe0 8px 16px)',
              }}
            >
              <span className="eyebrow text-mute">[ Retrato do corretor — enviar foto ]</span>
            </div>
          )}
        </div>

        {/* Texto + números */}
        <div>
          <p className="eyebrow text-gold-soft">Sobre</p>
          <h2 className="display mt-4 text-3xl text-ink sm:text-4xl">
            Especialista em casas de campo, Brasil e Portugal.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-relaxed text-mute">
            Atuação dedicada ao alto padrão em Porto Feliz e região, com curadoria de
            propriedades rurais, haras e casas em condomínio fechado. Cada visita é
            conduzida pessoalmente.
          </p>

          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-3">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="display text-3xl text-ink">{s.value}</dt>
                <dd className="eyebrow mt-2 text-mute">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
