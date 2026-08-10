import type { DetailsPageBlock } from '#/lib/page-blocks/types'
import type { PublicWeddingSettings } from '#/lib/wedding/public-settings'

export function DetailsBlock({
  block,
  wedding,
}: {
  block: DetailsPageBlock
  wedding: PublicWeddingSettings
}) {
  const venueParts = [
    block.fields.showVenue ? wedding.venue_name : null,
    block.fields.showVenue ? wedding.venue_location : null,
  ].filter(Boolean)
  const dressCode =
    block.fields.showDressCode && wedding.dress_code ? wedding.dress_code : null

  if (venueParts.length === 0 && !dressCode) {
    return null
  }

  return (
    <section className="border-border border-t px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-2">
        {venueParts.length > 0 ? (
          <div>
            <p className="public-kicker mb-3">Venue</p>
            <p className="font-serif text-3xl italic">{venueParts[0]}</p>
            {venueParts[1] ? (
              <p className="text-foreground-secondary mt-2 text-sm">
                {venueParts[1]}
              </p>
            ) : null}
          </div>
        ) : null}
        {dressCode ? (
          <div>
            <p className="public-kicker mb-3">Dress code</p>
            <p className="text-foreground-secondary whitespace-pre-wrap text-base leading-relaxed">
              {dressCode}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
