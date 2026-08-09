import { createFileRoute } from '@tanstack/react-router'
import { Heart } from '@phosphor-icons/react'
import { cn } from '#/lib/utils'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <main
      className={cn(
        'mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center',
      )}
    >
      <Heart
        className="text-foreground-secondary size-8"
        weight="thin"
        aria-hidden
      />
      <div className="space-y-3">
        <p className="text-foreground-secondary text-sm tracking-[0.2em] uppercase">
          Wedding website
        </p>
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Marvelous &amp; Lillian
        </h1>
        <p className="text-foreground-secondary mx-auto max-w-md text-base leading-relaxed">
          Our site is being prepared. Date to be announced.
        </p>
      </div>
      <p
        className="text-foreground-secondary border-border mt-4 border-t pt-4 text-xs tracking-wide uppercase"
        data-testid="health-status"
      >
        Status: healthy
      </p>
    </main>
  )
}
