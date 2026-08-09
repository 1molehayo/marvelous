import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { COLOR_MODE_INIT_SCRIPT } from '#/lib/color-mode'
import { ACTIVE_PUBLIC_THEME } from '#/lib/site-settings'

import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
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
  return (
    <html lang="en" data-theme={ACTIVE_PUBLIC_THEME} data-mode="light">
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
