import { Link } from '@tanstack/react-router'
import { PublicShell } from '#/components/public-shell'
import { Button } from '#/components/ui/button'

export function NotFoundPage() {
  return (
    <PublicShell>
      <main className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-6 py-16">
        <div className="max-w-lg text-center">
          <p className="public-kicker mb-6">404</p>
          <h1 className="public-section-title">Page not found</h1>
          <p className="text-foreground-secondary mt-4 text-sm leading-relaxed">
            That link doesn&apos;t match anything on this wedding site.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild>
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}
