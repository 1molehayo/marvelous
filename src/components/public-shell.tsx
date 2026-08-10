import { Link } from '@tanstack/react-router'
import { ColorModeToggle } from '#/components/color-mode-toggle'
import { FALLBACK_PUBLIC_THEME } from '#/lib/site-settings'
import type { PublicThemeId } from '#/lib/site-settings'
import { cn } from '#/lib/utils'

export function PublicShell({
  children,
  className,
  theme = FALLBACK_PUBLIC_THEME,
  coupleLabel = 'Marvelous & Lillian',
}: {
  children: React.ReactNode
  className?: string
  theme?: PublicThemeId
  coupleLabel?: string
}) {
  return (
    <div
      className={cn('min-h-dvh bg-background text-foreground', className)}
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
          <div className="flex items-center gap-2">
            <Link
              to="/design"
              className="text-foreground-secondary hover:text-foreground hidden text-xs tracking-[0.18em] uppercase sm:inline"
            >
              Design
            </Link>
            <ColorModeToggle />
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
