/**
 * Site settings stub for Phase 2.
 * Active public theme will be admin-managed in Website settings (Phase 4+).
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
  { name: string; description: string; suggestedFor: string }
> = {
  celeste: {
    name: 'Celeste',
    description: 'Powder blue, navy, ivory, and champagne.',
    suggestedFor: 'Coming soon / announcement',
  },
  botanica: {
    name: 'Botanica',
    description: 'Sage, cream, navy, and soft champagne.',
    suggestedFor: 'Soft garden romantic',
  },
  rosewater: {
    name: 'Rosewater',
    description: 'Blush, dusty rose, cream, and champagne.',
    suggestedFor: 'Date announced / celebration',
  },
  nocturne: {
    name: 'Nocturne',
    description: 'Deep navy with powder blue and Naples yellow accents.',
    suggestedFor: 'Editorial evening look',
  },
}

/** Admin-selected theme for the public website (stub until Phase 4 settings UI). */
export const ACTIVE_PUBLIC_THEME: PublicThemeId = 'celeste'

export const COLOR_MODE_STORAGE_KEY = 'marvelous-color-mode'
