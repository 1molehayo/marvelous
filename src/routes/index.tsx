import { createFileRoute } from '@tanstack/react-router'
import { PublicShell } from '#/components/public-shell'
import { Button } from '#/components/ui/button'
import { PUBLIC_THEME_META, ACTIVE_PUBLIC_THEME } from '#/lib/site-settings'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <PublicShell>
      <main className="relative flex min-h-[calc(100dvh-4.5rem)] items-center justify-center overflow-hidden px-6 py-16">
        <div className="bg-background-secondary absolute inset-0 -z-10" />
        <div className="relative max-w-3xl text-center">
          <p className="public-kicker mb-8">We&apos;re getting married</p>
          <h1 className="public-display text-[clamp(3.5rem,11vw,7.5rem)]">
            Marvelous
            <br />
            <span className="text-highlight">&amp;</span>
            <br />
            Lillian
          </h1>
          <div className="bg-highlight mx-auto my-10 h-px w-20" />
          <p className="font-serif text-2xl md:text-3xl">
            Date to be announced
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
              Status: healthy · Theme:{' '}
              {PUBLIC_THEME_META[ACTIVE_PUBLIC_THEME].name}
            </p>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}
