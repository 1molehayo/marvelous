import { createFileRoute, notFound } from '@tanstack/react-router'
import { DynamicBlock } from '#/components/blocks/dynamic-block'
import { PublicShell } from '#/components/public-shell'
import { formatCoupleNames } from '#/lib/constants'
import { getPublicHomeData } from '#/lib/page-blocks/settings'
import { getPublicSectionNav } from '#/lib/page-blocks/types'
import { isReservedPublicSlug } from '#/lib/wedding/slug'
import { formatWeddingDate } from '#/lib/wedding/public-settings'

export const Route = createFileRoute('/$weddingSlug')({
  beforeLoad: ({ params }) => {
    if (isReservedPublicSlug(params.weddingSlug)) {
      throw notFound()
    }
  },
  loader: async ({ params }) => {
    try {
      return await getPublicHomeData({ data: { slug: params.weddingSlug } })
    } catch {
      throw notFound()
    }
  },
  head: ({ loaderData }) => {
    const coupleLabel = loaderData
      ? formatCoupleNames(loaderData.groom_name, loaderData.bride_name)
      : 'Wedding'
    const dateLabel = formatWeddingDate(loaderData?.wedding_date ?? null)
    const description =
      dateLabel === 'Date to be announced'
        ? `${coupleLabel} — wedding website.`
        : `${coupleLabel} — ${dateLabel}.`
    const ogImage =
      loaderData?.page_blocks
        .map((block) => loaderData.imageUrls[block.id])
        .find((url): url is string => Boolean(url)) ?? undefined

    return {
      meta: [
        { title: coupleLabel },
        { name: 'description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: coupleLabel },
        { property: 'og:description', content: description },
        ...(ogImage
          ? [
              { property: 'og:image', content: ogImage },
              { name: 'twitter:card', content: 'summary_large_image' },
              { name: 'twitter:image', content: ogImage },
            ]
          : [{ name: 'twitter:card', content: 'summary' }]),
        { name: 'twitter:title', content: coupleLabel },
        { name: 'twitter:description', content: description },
      ],
    }
  },
  component: WeddingPublicPage,
})

function WeddingPublicPage() {
  const home = Route.useLoaderData()
  const { weddingSlug } = Route.useParams()
  const sectionNav = getPublicSectionNav(home.page_blocks)

  return (
    <PublicShell
      theme={home.active_public_theme}
      coupleLabel={formatCoupleNames(home.groom_name, home.bride_name)}
      weddingDate={home.wedding_date}
      sectionNav={sectionNav}
      homePath={`/${weddingSlug}`}
    >
      <main>
        {home.page_blocks.map((block) => (
          <DynamicBlock
            key={block.id}
            block={block}
            wedding={home}
            imageUrl={home.imageUrls[block.id]}
          />
        ))}
      </main>
    </PublicShell>
  )
}
