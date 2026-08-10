import { createFileRoute } from '@tanstack/react-router'
import { PublicShell } from '#/components/public-shell'
import { Button } from '#/components/ui/button'
import { PUBLIC_THEME_META } from '#/lib/site-settings'
import { getPublicWeddingSettings } from '#/lib/wedding/settings'

export const Route = createFileRoute('/')({
  loader: () => getPublicWeddingSettings(),
  component: HomePage,
})

function formatWeddingDate(date: string | null) {
  if (!date) return 'Date to be announced'
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    dateStyle: 'long',
  })
}

function HomePage() {
  const wedding = Route.useLoaderData()
  const themeMeta = PUBLIC_THEME_META[wedding.active_public_theme]

  return (
    <PublicShell
      theme={wedding.active_public_theme}
      coupleLabel={`${wedding.partner_one_name} & ${wedding.partner_two_name}`}
    >
      <main className="relative flex min-h-[calc(100dvh-4.5rem)] items-center justify-center overflow-hidden px-6 py-16">
        <div className="bg-background-secondary absolute inset-0 -z-10" />
        <div className="relative max-w-3xl text-center">
          <p className="public-kicker mb-8">We&apos;re getting married</p>
          <h1 className="public-display text-[clamp(3.5rem,11vw,7.5rem)]">
            {wedding.partner_one_name}
            <br />
            <span className="text-highlight">&amp;</span>
            <br />
            {wedding.partner_two_name}
          </h1>
          <div className="bg-highlight mx-auto my-10 h-px w-20" />
          <p className="font-serif text-2xl md:text-3xl">
            {formatWeddingDate(wedding.wedding_date)}
          </p>
          <p className="text-foreground-secondary mt-3 text-sm tracking-[0.2em] uppercase">
            Our site is being prepared
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <a href="/design">View design system</a>
            </Button>
            <p
              className="text-foreground-secondary text-xs tracking-wide uppercase"
              data-testid="health-status"
            >
              Status: healthy · Theme: {themeMeta.name}
            </p>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}
