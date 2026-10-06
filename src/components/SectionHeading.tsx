import type { ReactNode } from 'react'

export default function SectionHeading({
  title,
  aside,
}: {
  title: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
      <h2 className="display text-2xl text-ink sm:text-3xl">{title}</h2>
      {aside && <span className="eyebrow shrink-0 text-mute">{aside}</span>}
    </div>
  )
}
