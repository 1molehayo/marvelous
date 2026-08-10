import { createFileRoute } from '@tanstack/react-router'
import { DynamicBlock } from '#/components/blocks/dynamic-block'
import { PublicShell } from '#/components/public-shell'
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
      coupleLabel={`${home.partner_one_name} & ${home.partner_two_name}`}
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
