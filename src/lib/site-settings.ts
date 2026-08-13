/**
 * Public theme catalog + visitor color-mode key.
 * Active theme is stored on `weddings.active_public_theme` (admin settings).
 * Admin console uses its own tokens via `[data-surface=admin]` — never these.
 */

export const PUBLIC_THEMES = [
  'celeste',
  'botanica',
  'rosewater',
  'nocturne',
] as const

export type PublicThemeId = (typeof PUBLIC_THEMES)[number]

export type ColorMode = 'light' | 'dark'

export const PUBLIC_THEME_META: Record<
  PublicThemeId,
  {
    name: string
    description: string
    suggestedFor: string
    /** Swatch colors for the admin theme picker (display only). */
    swatches: [string, string, string, string]
  }
> = {
  celeste: {
    name: 'Celeste',
    description: 'Powder blue, navy, ivory, and champagne.',
    suggestedFor: 'Coming soon / announcement',
    swatches: ['#faf8f4', '#1a2744', '#6f93b8', '#c4a574'],
  },
  botanica: {
    name: 'Botanica',
    description: 'Sage, cream, navy, and soft champagne.',
    suggestedFor: 'Soft garden romantic',
    swatches: ['#f7f5ef', '#1a2744', '#8fa88a', '#c4a574'],
  },
  rosewater: {
    name: 'Rosewater',
    description: 'Blush, dusty rose, cream, and champagne.',
    suggestedFor: 'Date announced / celebration',
    swatches: ['#faf6f4', '#3d2a2a', '#c99393', '#c4a574'],
  },
  nocturne: {
    name: 'Nocturne',
    description: 'Deep navy with powder blue and Naples yellow accents.',
    suggestedFor: 'Editorial evening look',
    swatches: ['#0f1729', '#f3efe6', '#9bb8d4', '#e8c97a'],
  },
}

/** Used when the wedding row is unavailable (build / offline). */
export const FALLBACK_PUBLIC_THEME: PublicThemeId = 'celeste'

export const COLOR_MODE_STORAGE_KEY = 'wedding-website-builder-color-mode'
