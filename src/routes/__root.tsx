import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { AppRouteError, NotFoundPage } from '#/components/app-error-page'
import { formatCoupleNames } from '#/lib/constants'
import { COLOR_MODE_INIT_SCRIPT } from '#/lib/color-mode'
import { internalError } from '#/lib/errors/route-error'
import { getPublicWeddingSettings } from '#/lib/wedding/settings'

import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  loader: async () => {
    try {
      const wedding = await getPublicWeddingSettings()
      const coupleLabel = formatCoupleNames(
        wedding.groom_name,
        wedding.bride_name,
      )
      return {
        publicTheme: wedding.active_public_theme,
        coupleLabel,
      }
    } catch (cause) {
      throw internalError({
        message: 'Failed to load root public wedding settings',
        cause,
      })
    }
  },
  notFoundComponent: NotFoundPage,
  errorComponent: AppRouteError,
  head: ({ loaderData }) => {
    const coupleLabel = loaderData?.coupleLabel ?? 'Marvelous & Lillian'
    return {
      meta: [
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        { title: coupleLabel },
        {
          name: 'description',
          content: `Wedding website for ${coupleLabel}.`,
        },
        { name: 'theme-color', content: '#faf8f4' },
      ],
      links: [{ rel: 'stylesheet', href: appCss }],
    }
  },
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { publicTheme } = Route.useLoaderData()

  return (
    <html lang="en" data-theme={publicTheme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
