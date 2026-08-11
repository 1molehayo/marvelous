import { useEffect } from 'react'
import { ColorModeToggle } from '#/components/color-mode-toggle'
import { FALLBACK_PUBLIC_THEME } from '#/lib/site-settings'
import type { PublicThemeId } from '#/lib/site-settings'
import type { PublicSectionNavItem } from '#/lib/page-blocks/types'
import { formatWeddingDate } from '#/lib/wedding/public-settings'
import { cn } from '#/lib/utils'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function scrollToSection(sectionId: string, behavior?: ScrollBehavior) {
  const el = document.getElementById(sectionId)
  if (!el) return false

  el.scrollIntoView({
    behavior: behavior ?? (prefersReducedMotion() ? 'auto' : 'smooth'),
    block: 'start',
  })

  return true
}

function onSectionNavClick(
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string,
) {
  event.preventDefault()
  if (scrollToSection(sectionId)) {
    window.history.pushState(null, '', `#${sectionId}`)
  }
}

function SectionNav({
  items,
  className,
  ariaLabel,
}: {
  items: PublicSectionNavItem[]
  className?: string
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          onClick={(event) => onSectionNavClick(event, item.id)}
          className="text-foreground-secondary hover:text-foreground shrink-0 text-xs tracking-[0.16em] uppercase transition"
        >
          {item.label}
        </a>
      ))}
    </nav>
  )
}

export function PublicShell({
  children,
  className,
  theme = FALLBACK_PUBLIC_THEME,
  coupleLabel = 'Wedding',
  weddingDate = null,
  showWeddingDate = true,
  sectionNav = [],
  homePath = '/',
}: {
  children: React.ReactNode
  className?: string
  theme?: PublicThemeId
  coupleLabel?: string
  weddingDate?: string | null
  /** When false, footer omits the date line (e.g. RSVP error). */
  showWeddingDate?: boolean
  sectionNav?: PublicSectionNavItem[]
  /** Couple brand link target (wedding slug path). */
  homePath?: string
}) {
  const showSectionNav = sectionNav.length > 1

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(hash, 'auto')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

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
            {showSectionNav ? (
              <SectionNav
                items={sectionNav}
                ariaLabel="Page sections"
                className="hidden items-center gap-4 sm:flex"
              />
            ) : null}
            <ColorModeToggle />
          </div>
        </div>
        {showSectionNav ? (
          <div className="border-border border-t px-4 py-2.5 sm:hidden">
            <SectionNav
              items={sectionNav}
              ariaLabel="Page sections"
              className="public-section-nav-scroll mx-auto flex max-w-5xl items-center gap-4"
            />
          </div>
        ) : null}
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-border mt-auto border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-10 text-center md:py-12">
          <p className="font-serif text-2xl italic md:text-3xl">{coupleLabel}</p>
          {showWeddingDate ? (
            <p className="text-foreground-secondary text-sm tracking-[0.12em] uppercase">
              {formatWeddingDate(weddingDate)}
            </p>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
