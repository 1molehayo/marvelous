import { useEffect, useId, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { List, SignOut, X } from '@phosphor-icons/react'
import { Button } from '#/components/ui/button'
import { Toaster } from '#/components/ui/toaster'
import { isSuperAdminProfile } from '#/lib/auth/roles'
import type { AdminSession } from '#/lib/auth/types'
import {
  PRODUCT_NAME,
  PRODUCT_SHORT_NAME,
  PRODUCT_TAGLINE,
  formatCoupleNames,
  getAdminNavItems,
} from '#/lib/constants'
import { cn } from '#/lib/utils'

function SidebarBrand() {
  return (
    <div className="shrink-0">
      <p className="font-serif text-xl italic">{PRODUCT_SHORT_NAME}</p>
      <p className="text-sidebar-foreground/60 mt-1 text-[0.65rem] tracking-[0.2em] uppercase">
        {PRODUCT_TAGLINE}
      </p>
      <p className="sr-only">{PRODUCT_NAME}</p>
    </div>
  )
}

function SidebarNav({
  navItems,
  onNavigate,
}: {
  navItems: ReturnType<typeof getAdminNavItems>
  onNavigate?: () => void
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto text-sm">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="rounded-lg px-3 py-2 transition"
          activeOptions={{ exact: item.exact }}
          activeProps={{
            className: 'bg-accent/25 text-sidebar-foreground',
          }}
          inactiveProps={{
            className: 'text-sidebar-foreground/70 hover:bg-white/5',
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

function SidebarFooter({
  session,
  onLogout,
  isLoggingOut,
}: {
  session: AdminSession
  onLogout: () => void
  isLoggingOut?: boolean
}) {
  const wedding = session.wedding
  const dateLabel = wedding?.wedding_date
    ? new Date(`${wedding.wedding_date}T00:00:00`).toLocaleDateString(
        undefined,
        { dateStyle: 'long' },
      )
    : wedding
      ? 'Date to be announced'
      : 'Wedding not set up'

  return (
    <div className="shrink-0 space-y-3 border-t border-white/10 pt-4">
      <div className="text-sm">
        <p className="font-serif italic">
          {wedding
            ? formatCoupleNames(wedding.groom_name, wedding.bride_name)
            : 'No wedding yet'}
        </p>
        <p className="text-sidebar-foreground/60 mt-1 text-xs">{dateLabel}</p>
        <p className="text-sidebar-foreground/60 mt-1 text-xs">
          {session.user.email}
        </p>
        {isSuperAdminProfile(session.profile) ? (
          <p className="text-sidebar-foreground/60 mt-1 text-xs tracking-wide uppercase">
            Super admin
          </p>
        ) : null}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="border-white/20 bg-transparent text-sidebar-foreground hover:bg-white/10"
        onClick={onLogout}
        isLoading={isLoggingOut}
      >
        <SignOut />
        Sign out
      </Button>
    </div>
  )
}

export function AdminShell({
  session,
  children,
  onLogout,
  isLoggingOut,
}: {
  session: AdminSession
  children: React.ReactNode
  onLogout: () => void
  isLoggingOut?: boolean
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const titleId = useId()
  const navItems = getAdminNavItems(isSuperAdminProfile(session.profile), {
    hasWedding: Boolean(session.wedding),
  })

  useEffect(() => {
    if (!mobileNavOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <div
      data-surface="admin"
      className="bg-background text-foreground min-h-dvh"
    >
      <Toaster />

      <div className="border-border bg-surface sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3 md:hidden">
        <Button
          type="button"
          size="sm"
          variant="outline"
          square
          aria-expanded={mobileNavOpen}
          aria-controls="admin-mobile-nav"
          aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X /> : <List />}
        </Button>
        <div className="min-w-0">
          <p className="font-serif truncate text-lg italic">
            {PRODUCT_SHORT_NAME}
          </p>
          <p className="text-foreground-secondary truncate text-[0.65rem] tracking-[0.18em] uppercase">
            {PRODUCT_TAGLINE}
          </p>
        </div>
      </div>

      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={closeMobileNav}
        />
      ) : null}

      <aside
        id="admin-mobile-nav"
        aria-labelledby={titleId}
        className={cn(
          'bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col gap-6 p-4 transition-transform duration-200 md:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <span id={titleId} className="sr-only">
          Admin navigation
        </span>
        <SidebarBrand />
        <SidebarNav navItems={navItems} onNavigate={closeMobileNav} />
        <SidebarFooter
          session={session}
          onLogout={onLogout}
          isLoggingOut={isLoggingOut}
        />
      </aside>

      <div className="md:grid md:min-h-dvh md:grid-cols-[15rem_1fr]">
        <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-dvh flex-col gap-6 p-4 md:flex">
          <SidebarBrand />
          <SidebarNav navItems={navItems} />
          <SidebarFooter
            session={session}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
          />
        </aside>

        <div className="bg-background min-w-0 p-6 md:p-8">{children}</div>
      </div>
    </div>
  )
}
