import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { NotFoundPage } from '#/components/not-found'
import { COLOR_MODE_INIT_SCRIPT } from '#/lib/color-mode'
import { getPublicWeddingSettings } from '#/lib/wedding/settings'

import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  loader: async () => {
    const wedding = await getPublicWeddingSettings()
    return { publicTheme: wedding.active_public_theme }
  },
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'Marvelous & Lillian' },
      {
        name: 'description',
        content: 'Wedding website for Marvelous & Lillian.',
      },
      { name: 'theme-color', content: '#faf8f4' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { publicTheme } = Route.useLoaderData()

  return (
    <html lang="en" data-theme={publicTheme} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: COLOR_MODE_INIT_SCRIPT }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
