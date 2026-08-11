import { Link, createFileRoute } from '@tanstack/react-router'
import { ColorModeToggle } from '#/components/color-mode-toggle'
import { Button } from '#/components/ui/button'
import { getAdminSession } from '#/lib/auth/session'
import {
  CREATOR_NAME,
  CREATOR_URL,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from '#/lib/constants'
import { getFeaturedWeddingSlug } from '#/lib/page-blocks/settings'
import { FALLBACK_PUBLIC_THEME } from '#/lib/site-settings'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [featuredSlug, session] = await Promise.all([
      getFeaturedWeddingSlug(),
      getAdminSession(),
    ])
    return { featuredSlug, isSignedIn: Boolean(session) }
  },
  head: () => ({
    meta: [
      { title: `${PRODUCT_NAME} — ${PRODUCT_TAGLINE}` },
      {
        name: 'description',
        content:
          'Create a beautiful wedding website for your celebration — invitations, details, and RSVPs in one place.',
      },
    ],
  }),
  component: LandingPage,
})

function LandingPage() {
  const { featuredSlug, isSignedIn } = Route.useLoaderData()

  return (
    <div
      className="public-shell flex min-h-dvh flex-col bg-background text-foreground"
      data-public-theme={FALLBACK_PUBLIC_THEME}
    >
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-6 py-6">
        <p className="font-serif text-xl italic md:text-2xl">{PRODUCT_NAME}</p>
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              to="/admin"
              className="text-foreground-secondary hover:text-foreground text-xs tracking-[0.16em] uppercase transition"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/admin/login"
              className="text-foreground-secondary hover:text-foreground text-xs tracking-[0.16em] uppercase transition"
            >
              Get started
            </Link>
          )}
          <ColorModeToggle />
        </div>
      </header>

      <main className="public-hero-atmosphere relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
        <p className="public-kicker public-reveal mb-8">{PRODUCT_TAGLINE}</p>
        <h1 className="public-display public-reveal-delay-1 text-[clamp(3.5rem,12vw,7rem)]">
          {PRODUCT_NAME}
        </h1>
        <p className="text-foreground-secondary public-reveal-delay-2 mx-auto mt-6 max-w-md text-base leading-relaxed md:text-lg">
          A calm, beautiful home for your wedding story — share details, welcome
          guests, and celebrate together.
        </p>
        <div className="public-reveal-delay-3 mt-10 flex flex-wrap items-center justify-center gap-3">
          {featuredSlug ? (
            <Button asChild size="md">
              <Link to="/$weddingSlug" params={{ weddingSlug: featuredSlug }}>
                View a wedding
              </Link>
            </Button>
          ) : null}
          <Button asChild size="md" variant={featuredSlug ? 'outline' : 'primary'}>
            {isSignedIn ? (
              <Link to="/admin">Build your wedding</Link>
            ) : (
              <Link to="/admin/login">Get started</Link>
            )}
          </Button>
        </div>
      </main>

      <footer className="border-border relative z-10 border-t px-6 py-8 text-center">
        <p className="text-foreground-secondary text-xs tracking-[0.14em] uppercase">
          © {new Date().getFullYear()} {PRODUCT_NAME}
        </p>
        <p className="text-foreground-secondary mt-2 text-sm">
          Made with love by{' '}
          <a
            href={CREATOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline-offset-4 transition hover:underline"
          >
            {CREATOR_NAME}
          </a>
        </p>
      </footer>
    </div>
  )
}
