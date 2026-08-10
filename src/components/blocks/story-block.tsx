import type { StoryPageBlock } from '#/lib/page-blocks/types'

export function StoryBlock({ block }: { block: StoryPageBlock }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="public-kicker mb-4">Story</p>
      <h2 className="font-serif text-4xl italic md:text-5xl">
        {block.fields.title}
      </h2>
      {block.fields.body ? (
        <p className="text-foreground-secondary mt-6 whitespace-pre-wrap text-base leading-relaxed md:text-lg">
          {block.fields.body}
        </p>
      ) : null}
    </section>
  )
}
