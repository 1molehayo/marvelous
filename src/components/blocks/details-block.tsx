import type { DetailsPageBlock } from '#/lib/page-blocks/types'
import { publicSectionId } from '#/lib/page-blocks/types'
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
  const sectionId = publicSectionId(block)

  if (venueParts.length === 0 && !dressCode) {
    return (
      <section
        id={sectionId}
        className="public-section border-border scroll-mt-24 border-t px-6"
      >
        <div className="public-reveal mx-auto max-w-3xl text-center">
          <p className="public-kicker mb-4">Details</p>
          <h2 className="public-section-title">Celebrate with us</h2>
          <p className="text-foreground-secondary mt-5 text-base leading-relaxed">
            Venue and dress code will be shared here when they&apos;re ready.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      id={sectionId}
      className="public-section border-border scroll-mt-24 border-t px-6"
    >
      <div className="public-reveal mx-auto max-w-4xl">
        <div className="mb-10 text-center md:mb-14">
          <p className="public-kicker mb-4">Details</p>
          <h2 className="public-section-title">Celebrate with us</h2>
        </div>
        <div className="grid gap-10 md:grid-cols-2 md:gap-12">
          {venueParts.length > 0 ? (
            <div>
              <p className="public-kicker mb-3">Venue</p>
              <p className="font-serif text-3xl italic md:text-4xl">
                {venueParts[0]}
              </p>
              {venueParts[1] ? (
                <p className="text-foreground-secondary mt-3 text-sm leading-relaxed md:text-base">
                  {venueParts[1]}
                </p>
              ) : null}
            </div>
          ) : null}
          {dressCode ? (
            <div>
              <p className="public-kicker mb-3">Dress code</p>
              <p className="text-foreground-secondary whitespace-pre-wrap text-base leading-relaxed md:text-lg">
                {dressCode}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
