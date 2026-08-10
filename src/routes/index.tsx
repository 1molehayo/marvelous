import { createFileRoute } from '@tanstack/react-router'
import { DynamicBlock } from '#/components/blocks/dynamic-block'
import { PublicShell } from '#/components/public-shell'
import { formatCoupleNames } from '#/lib/constants'
import { getPublicHomeData } from '#/lib/page-blocks/settings'

export const Route = createFileRoute('/')({
  loader: () => getPublicHomeData(),
  component: HomePage,
})

function HomePage() {
  const home = Route.useLoaderData()

  return (
    <PublicShell
      theme={home.active_public_theme}
      coupleLabel={formatCoupleNames(home.groom_name, home.bride_name)}
      weddingDate={home.wedding_date}
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
