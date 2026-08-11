import { ColorModeToggle } from '#/components/color-mode-toggle'
import { FALLBACK_PUBLIC_THEME } from '#/lib/site-settings'
import type { PublicThemeId } from '#/lib/site-settings'
import type { PublicSectionNavItem } from '#/lib/page-blocks/types'
import { formatWeddingDate } from '#/lib/wedding/public-settings'
import { cn } from '#/lib/utils'

function scrollToSection(sectionId: string) {
  const el = document.getElementById(sectionId)
  if (!el) return

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches

  el.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })

  window.history.pushState(null, '', `#${sectionId}`)
}

function onSectionNavClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string,
) {
  event.preventDefault()
  scrollToSection(sectionId)
}

export function PublicShell({
  children,
  className,
  theme = FALLBACK_PUBLIC_THEME,
  coupleLabel = 'Marvelous & Lillian',
  weddingDate = null,
  sectionNav = [],
  homePath = '/',
}: {
  children: React.ReactNode
  className?: string
  theme?: PublicThemeId
  coupleLabel?: string
  weddingDate?: string | null
  sectionNav?: PublicSectionNavItem[]
  /** Couple brand link target (wedding slug path). */
  homePath?: string
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
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 md:gap-4 md:px-6">
          <a
            href={homePath}
            className="font-serif truncate text-lg italic md:text-xl"
          >
            {coupleLabel}
          </a>
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            {sectionNav.length > 1 ? (
              <nav
                aria-label="Page sections"
                className="hidden items-center gap-4 sm:flex"
              >
                {sectionNav.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(event) => onSectionNavClick(event, item.id)}
                    className="text-foreground-secondary hover:text-foreground text-xs tracking-[0.16em] uppercase transition"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            ) : null}
            <ColorModeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-border mt-auto border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-10 text-center md:py-12">
          <p className="font-serif text-2xl italic md:text-3xl">{coupleLabel}</p>
          <p className="text-foreground-secondary text-sm tracking-[0.12em] uppercase">
            {formatWeddingDate(weddingDate)}
          </p>
          {sectionNav.length > 1 ? (
            <nav
              aria-label="Footer sections"
              className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:hidden"
            >
              {sectionNav.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(event) => onSectionNavClick(event, item.id)}
                  className="text-foreground-secondary hover:text-foreground text-xs tracking-[0.14em] uppercase"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
