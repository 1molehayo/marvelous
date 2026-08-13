import { useState } from 'react'
import { CheckIcon } from '@phosphor-icons/react'
import { Button } from '#/components/ui/button'
import { formatCoupleNames } from '#/lib/constants'
import { PUBLIC_THEME_META, PUBLIC_THEMES } from '#/lib/site-settings'
import type { ColorMode, PublicThemeId } from '#/lib/site-settings'
import { cn } from '#/lib/utils'

export function ThemePicker({
  value,
  onChange,
  groomName,
  brideName,
  weddingDateLabel,
}: {
  value: PublicThemeId
  onChange: (theme: PublicThemeId) => void
  groomName: string
  brideName: string
  weddingDateLabel: string
}) {
  const [previewMode, setPreviewMode] = useState<ColorMode>('light')
  const couple = formatCoupleNames(groomName, brideName)
  const meta = PUBLIC_THEME_META[value]

  return (
    <div className="space-y-5">
      <div>
        <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
          Colour theme
        </p>
        <p className="text-foreground-secondary mt-1 text-sm">
          Applies to your public wedding site. The admin console stays on its
          own look.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PUBLIC_THEMES.map((themeId) => {
          const item = PUBLIC_THEME_META[themeId]
          const selected = value === themeId
          return (
            <button
              key={themeId}
              type="button"
              onClick={() => onChange(themeId)}
              className={cn(
                'border-border bg-surface rounded-xl border p-4 text-left transition',
                selected
                  ? 'border-accent ring-ring ring-2'
                  : 'hover:border-foreground/20',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-foreground-secondary mt-1 text-xs leading-relaxed">
                    {item.description}
                  </p>
                </div>
                {selected ? (
                  <span className="bg-accent text-accent-foreground inline-flex size-6 items-center justify-center rounded-full">
                    <CheckIcon className="size-3.5" weight="bold" />
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex gap-1.5">
                {item.swatches.map((color) => (
                  <span
                    key={color}
                    className="border-border size-6 rounded-full border"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="border-border bg-background-secondary/40 space-y-3 rounded-xl border border-dashed p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
              Preview: {meta.name}
            </p>
            <p className="text-foreground-secondary mt-1 text-xs">
              Not live. Shows how guests and email may look.
            </p>
          </div>
          <div className="flex gap-1">
            {(['light', 'dark'] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={previewMode === mode ? 'primary' : 'outline'}
                onClick={() => setPreviewMode(mode)}
              >
                {mode === 'light' ? 'Light' : 'Dark'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-foreground-secondary text-xs font-medium tracking-[0.14em] uppercase">
              Hero
            </p>
            <div
              data-theme={value}
              data-mode={previewMode}
              className="bg-background text-foreground overflow-hidden rounded-xl border border-black/10 shadow-sm"
            >
              <div className="public-hero-atmosphere relative flex min-h-52 flex-col items-center justify-center px-4 py-8 text-center">
                <p className="text-foreground-secondary text-[0.65rem] tracking-[0.18em] uppercase">
                  We&apos;re getting married
                </p>
                <p className="font-serif mt-3 text-3xl italic leading-tight">
                  {groomName}
                  <br />
                  <span className="text-highlight">&amp;</span>
                  <br />
                  {brideName}
                </p>
                <p className="font-serif mt-4 text-sm">{weddingDateLabel}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-foreground-secondary text-xs font-medium tracking-[0.14em] uppercase">
              RSVP email
            </p>
            <div
              data-theme={value}
              data-mode={previewMode}
              className="bg-background-secondary overflow-hidden rounded-xl border border-black/10 shadow-sm"
            >
              <div className="bg-background text-foreground mx-3 my-3 rounded-lg border border-black/5 px-4 py-5 shadow-sm">
                <p className="text-foreground-secondary text-[0.65rem] tracking-[0.16em] uppercase">
                  You&apos;re invited
                </p>
                <p className="font-serif mt-2 text-2xl italic">{couple}</p>
                <p className="text-foreground-secondary mt-3 text-sm leading-relaxed">
                  Please RSVP for {couple}. {weddingDateLabel}.
                </p>
                <div className="mt-5">
                  <span className="bg-accent text-accent-foreground inline-block rounded-lg px-4 py-2 text-sm font-medium">
                    Respond to RSVP
                  </span>
                </div>
                <p className="text-foreground-secondary mt-4 text-xs">
                  This is a preview of the invite email style.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
