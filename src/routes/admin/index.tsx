import { createFileRoute } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Route as AdminRoute } from './route'

export const Route = createFileRoute('/admin/')({
  component: AdminOverviewPage,
})

function AdminOverviewPage() {
  const { session } = AdminRoute.useRouteContext()

  if (!session) {
    return null
  }

  const { wedding, profile, user } = session

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Overview</h1>
          <p className="text-foreground-secondary mt-2 text-sm">
            Secure admin access is live. Full dashboard editing arrives in Phase
            4.
          </p>
        </div>
        <Badge variant="info">{wedding.status.replaceAll('_', ' ')}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-surface border-border rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Couple
          </p>
          <p className="font-serif mt-2 text-2xl italic">
            {wedding.partner_one_name} &amp; {wedding.partner_two_name}
          </p>
        </div>
        <div className="bg-surface border-border rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Wedding date
          </p>
          <p className="font-serif mt-2 text-2xl italic">
            {wedding.wedding_date ?? 'To be announced'}
          </p>
          <p className="text-foreground-secondary mt-2 text-sm">
            Nullable by design — no placeholder date is stored.
          </p>
        </div>
        <div className="bg-surface border-border rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Public theme
          </p>
          <p className="mt-2 text-lg capitalize">{wedding.active_public_theme}</p>
        </div>
        <div className="bg-surface border-border rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Signed in as
          </p>
          <p className="mt-2 text-lg">{profile.display_name ?? 'Admin'}</p>
          <p className="text-foreground-secondary text-sm">{user.email}</p>
        </div>
      </div>
    </div>
  )
}
