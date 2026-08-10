import { Link } from '@tanstack/react-router'
import { ColorModeToggle } from '#/components/color-mode-toggle'
import { FALLBACK_PUBLIC_THEME } from '#/lib/site-settings'
import type { PublicThemeId } from '#/lib/site-settings'
import { formatWeddingDate } from '#/lib/wedding/public-settings'
import { cn } from '#/lib/utils'

export function PublicShell({
  children,
  className,
  theme = FALLBACK_PUBLIC_THEME,
  coupleLabel = 'Marvelous & Lillian',
  weddingDate = null,
}: {
  children: React.ReactNode
  className?: string
  theme?: PublicThemeId
  coupleLabel?: string
  weddingDate?: string | null
}) {
  return (
    <div
      className={cn(
        'public-shell flex min-h-dvh flex-col bg-background text-foreground',
        className,
      )}
      data-public-theme={theme}
    >
      <header className="border-border sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link
            to="/"
            className="font-serif truncate text-lg italic md:text-xl"
          >
            {coupleLabel}
          </Link>
          <ColorModeToggle />
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-border mt-auto border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-10 text-center md:py-12">
          <p className="font-serif text-2xl italic md:text-3xl">{coupleLabel}</p>
          <p className="text-foreground-secondary text-sm tracking-[0.12em] uppercase">
            {formatWeddingDate(weddingDate)}
          </p>
        </div>
      </footer>
    </div>
  )
}
