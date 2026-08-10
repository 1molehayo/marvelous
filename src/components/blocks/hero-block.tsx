import type { HeroPageBlock } from '#/lib/page-blocks/types'
import { formatWeddingDate } from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'

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
    <section className="public-hero relative flex min-h-[calc(100dvh-4.5rem)] items-center justify-center overflow-hidden px-6 py-20 md:py-24">
      <div className="public-hero-atmosphere absolute inset-0 -z-10" aria-hidden />
      <div className="public-reveal relative mx-auto max-w-3xl text-center">
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
        <div className="bg-highlight public-reveal-delay-1 mx-auto my-10 h-px w-20" />
        <p className="public-reveal-delay-2 font-serif text-2xl md:text-3xl">
          {formatWeddingDate(wedding.wedding_date)}
        </p>
      </div>
    </section>
  )
}
