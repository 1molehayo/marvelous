import type { ImagePageBlock } from '#/lib/page-blocks/types'

export function ImageBlock({
  block,
  imageUrl,
}: {
  block: ImagePageBlock
  imageUrl?: string | null
}) {
  if (!imageUrl) {
    return null
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <figure>
        <img
          src={imageUrl}
          alt={block.fields.title ?? 'Wedding photo'}
          className="h-auto w-full object-cover"
        />
        {block.fields.title || block.fields.description ? (
          <figcaption className="mt-4 max-w-2xl">
            {block.fields.title ? (
              <p className="font-serif text-2xl italic">{block.fields.title}</p>
            ) : null}
            {block.fields.description ? (
              <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
                {block.fields.description}
              </p>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    </section>
  )
}
