import type { StoryPageBlock } from '#/lib/page-blocks/types'

export function StoryBlock({ block }: { block: StoryPageBlock }) {
  return (
    <section className="public-section mx-auto max-w-3xl px-6">
      <div className="public-reveal">
        <p className="public-kicker mb-4">Our story</p>
        <h2 className="public-section-title">{block.fields.title}</h2>
        {block.fields.body ? (
          <p className="text-foreground-secondary mt-6 whitespace-pre-wrap text-base leading-relaxed md:text-lg">
            {block.fields.body}
          </p>
        ) : null}
      </div>
    </section>
  )
}
