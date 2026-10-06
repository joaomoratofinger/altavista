export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string
  title: string
  subtitle?: string
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-14 pt-36 sm:px-8 sm:pt-44">
      <p className="eyebrow text-gold-soft">{eyebrow}</p>
      <h1 className="display mt-4 max-w-3xl text-4xl text-ink sm:text-5xl">{title}</h1>
      {subtitle && (
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-mute">{subtitle}</p>
      )}
    </section>
  )
}
