import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ColorModeToggle } from '#/components/color-mode-toggle'
import { PublicRevealObserver } from '#/components/public-reveal-observer'
import {
  PRODUCT_NAME,
  productBuiltWithCredit,
} from '#/lib/constants'
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
  setActiveId: (id: string) => void,
) {
  event.preventDefault()
  if (scrollToSection(sectionId)) {
    setActiveId(sectionId)
    window.history.pushState(null, '', `#${sectionId}`)
  }
}

function SectionNav({
  items,
  className,
  ariaLabel,
  activeId,
  setActiveId,
}: {
  items: PublicSectionNavItem[]
  className?: string
  ariaLabel: string
  activeId: string | null
  setActiveId: (id: string) => void
}) {
  return (
    <nav aria-label={ariaLabel} className={className}>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          data-active={activeId === item.id ? 'true' : 'false'}
          onClick={(event) => onSectionNavClick(event, item.id, setActiveId)}
          className="public-section-nav-link text-foreground-secondary hover:text-foreground shrink-0 text-xs tracking-[0.16em] uppercase transition"
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
  const [activeId, setActiveId] = useState<string | null>(
    sectionNav[0]?.id ?? null,
  )

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    if (!hash) return

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(hash, 'auto')
      setActiveId(hash)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!showSectionNav) return

    const sections = sectionNav
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const entry = visible.at(0)
        if (entry) setActiveId(entry.target.id)
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0.1, 0.35, 0.6] },
    )

    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [sectionNav, showSectionNav])

  return (
    <div
      className={cn(
        'public-shell flex min-h-dvh flex-col bg-background text-foreground',
        className,
      )}
      data-public-theme={theme}
    >
      <PublicRevealObserver />
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/95 backdrop-blur-md">
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
                activeId={activeId}
                setActiveId={setActiveId}
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
              activeId={activeId}
              setActiveId={setActiveId}
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
          <p className="text-foreground-secondary mt-4 text-xs tracking-[0.14em] uppercase">
            © {new Date().getFullYear()} {PRODUCT_NAME}
          </p>
          <p className="text-foreground-secondary text-sm">
            <Link
              to="/"
              className="text-foreground underline-offset-4 transition hover:underline"
            >
              {productBuiltWithCredit()}
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
