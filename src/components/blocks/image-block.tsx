import { useState } from 'react'
import type { ImagePageBlock } from '#/lib/page-blocks/types'
import { publicSectionId } from '#/lib/page-blocks/types'
import { cn } from '#/lib/utils'

export function ImageBlock({
  block,
  imageUrl,
}: {
  block: ImagePageBlock
  imageUrl?: string | null
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(imageUrl) && !failed

  return (
    <section
      id={publicSectionId(block)}
      className="public-section mx-auto max-w-5xl scroll-mt-24 px-6"
    >
      <figure className="public-reveal">
        <div
          className={cn(
            'border-border bg-background-secondary relative aspect-[4/5] w-full overflow-hidden rounded-sm border md:aspect-[16/10]',
            !showImage && 'flex items-center justify-center',
          )}
        >
          {showImage && imageUrl ? (
            <img
              src={imageUrl}
              alt={block.fields.title ?? 'Wedding photo'}
              loading="lazy"
              decoding="async"
              className="public-image h-full w-full object-cover"
              onError={() => setFailed(true)}
            />
          ) : (
            <p className="text-foreground-secondary px-6 text-center text-sm tracking-[0.14em] uppercase">
              Photo coming soon
            </p>
          )}
        </div>
        {block.fields.title || block.fields.description ? (
          <figcaption className="mt-5 max-w-2xl">
            {block.fields.title ? (
              <p className="font-serif text-2xl italic md:text-3xl">
                {block.fields.title}
              </p>
            ) : null}
            {block.fields.description ? (
              <p className="text-foreground-secondary mt-2 text-sm leading-relaxed md:text-base">
                {block.fields.description}
              </p>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    </section>
  )
}
