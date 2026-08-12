import { useState } from 'react'
import type { HeroPageBlock } from '#/lib/page-blocks/types'
import { publicSectionId } from '#/lib/page-blocks/types'
import { formatWeddingDate } from '#/lib/wedding/public-settings'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'
import { cn } from '#/lib/utils'

export function HeroBlock({
  block,
  wedding,
  imageUrl,
}: {
  block: HeroPageBlock
  wedding: PublicWeddingSettings
  imageUrl?: string | null
}) {
  const title = block.fields.title?.trim()
  const tagline = block.fields.tagline?.trim()
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = Boolean(imageUrl) && !photoFailed

  return (
    <section
      id={publicSectionId(block)}
      className={cn(
        'public-hero relative isolate flex min-h-[calc(100dvh-5.5rem)] scroll-mt-28 items-center justify-center overflow-hidden px-6 py-20 sm:min-h-[calc(100dvh-4.5rem)] sm:scroll-mt-24 md:py-24',
        showPhoto && 'text-white',
      )}
    >
      {showPhoto && imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt=""
            fetchPriority="high"
            decoding="async"
            sizes="100vw"
            className="absolute inset-0 z-0 h-full w-full object-cover"
            onError={() => setPhotoFailed(true)}
          />
          <div
            className="absolute inset-0 z-[1] bg-gradient-to-b from-black/50 via-black/40 to-black/60"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="public-hero-atmosphere absolute inset-0 z-0"
          aria-hidden
        />
      )}
      <div
        className={cn(
          'public-reveal relative z-10 mx-auto max-w-3xl text-center',
          showPhoto && 'drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)]',
        )}
      >
        {tagline ? (
          <p
            className={cn('public-kicker mb-8', showPhoto && 'text-white/90')}
          >
            {tagline}
          </p>
        ) : null}
        {title ? (
          <h1 className="public-display text-[clamp(3.25rem,11vw,7.5rem)]">
            {title}
          </h1>
        ) : (
          <h1 className="public-display text-[clamp(3.25rem,11vw,7.5rem)]">
            {wedding.groom_name}
            <br />
            <span className={showPhoto ? 'text-white' : 'text-highlight'}>
              &amp;
            </span>
            <br />
            {wedding.bride_name}
          </h1>
        )}
        <div
          className={cn(
            'public-reveal public-reveal-delay-1 mx-auto my-10 h-px w-20',
            showPhoto ? 'bg-white/80' : 'bg-highlight',
          )}
        />
        <p className="public-reveal public-reveal-delay-2 font-serif text-2xl md:text-3xl">
          {formatWeddingDate(wedding.wedding_date)}
        </p>
      </div>
    </section>
  )
}
