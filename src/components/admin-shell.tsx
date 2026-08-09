import { Link } from '@tanstack/react-router'
import { SignOut } from '@phosphor-icons/react'
import { Button } from '#/components/ui/button'
import type { AdminSession } from '#/lib/auth/session'
import { cn } from '#/lib/utils'

const navItems = [
  { to: '/admin', label: 'Overview', exact: true },
] as const

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
  const dateLabel = session.wedding.wedding_date
    ? new Date(`${session.wedding.wedding_date}T00:00:00`).toLocaleDateString(
        undefined,
        { dateStyle: 'long' },
      )
    : 'Date to be announced'

  return (
    <div data-surface="admin" className="bg-background text-foreground min-h-dvh">
      <div className="grid min-h-dvh md:grid-cols-[15rem_1fr]">
        <aside className="bg-sidebar text-sidebar-foreground flex flex-col gap-6 p-4">
          <div>
            <p className="font-serif text-xl italic">Marvelous</p>
            <p className="text-sidebar-foreground/60 mt-1 text-[0.65rem] tracking-[0.2em] uppercase">
              Wedding dashboard
            </p>
          </div>

          <nav className="flex flex-col gap-1 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
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

          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="text-sm">
              <p className="font-serif italic">
                {session.wedding.partner_one_name} &amp;{' '}
                {session.wedding.partner_two_name}
              </p>
              <p className="text-sidebar-foreground/60 mt-1 text-xs">
                {dateLabel}
              </p>
              <p className="text-sidebar-foreground/60 mt-1 text-xs">
                {session.user.email}
              </p>
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
        </aside>

        <div className={cn('bg-background p-6 md:p-8')}>{children}</div>
      </div>
    </div>
  )
}
