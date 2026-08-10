import type { HeroPageBlock } from '#/lib/page-blocks/types'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'

function formatWeddingDate(date: string | null) {
  if (!date) return 'Date to be announced'
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: 'long',
  })
}

export function HeroBlock({
  block,
  wedding,
}: {
  block: HeroPageBlock
  wedding: PublicWeddingSettings
}) {
  const title = block.fields.title?.trim()
  const tagline = block.fields.tagline?.trim()

  return (
    <section className="relative flex min-h-[calc(100dvh-4.5rem)] items-center justify-center overflow-hidden px-6 py-16">
      <div className="bg-background-secondary absolute inset-0 -z-10" />
      <div className="relative max-w-3xl text-center">
        {tagline ? <p className="public-kicker mb-8">{tagline}</p> : null}
        {title ? (
          <h1 className="public-display text-[clamp(3.5rem,11vw,7.5rem)]">
            {title}
          </h1>
        ) : (
          <h1 className="public-display text-[clamp(3.5rem,11vw,7.5rem)]">
            {wedding.groom_name}
            <br />
            <span className="text-highlight">&amp;</span>
            <br />
            {wedding.bride_name}
          </h1>
        )}
        <div className="bg-highlight mx-auto my-10 h-px w-20" />
        <p className="font-serif text-2xl md:text-3xl">
          {formatWeddingDate(wedding.wedding_date)}
        </p>
      </div>
    </section>
  )
}
