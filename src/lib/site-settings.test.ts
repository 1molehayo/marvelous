import { describe, expect, it } from 'vitest'
import {
  FALLBACK_PUBLIC_THEME,
  PUBLIC_THEMES,
  PUBLIC_THEME_META,
} from './site-settings'

describe('site settings', () => {
  it('exposes between 2 and 5 public themes', () => {
    expect(PUBLIC_THEMES.length).toBeGreaterThanOrEqual(2)
    expect(PUBLIC_THEMES.length).toBeLessThanOrEqual(5)
  })

  it('has metadata for every theme id', () => {
    for (const themeId of PUBLIC_THEMES) {
      expect(PUBLIC_THEME_META[themeId].name).toBeTruthy()
      expect(PUBLIC_THEME_META[themeId].description).toBeTruthy()
    }
  })

  it('uses a known fallback public theme', () => {
    expect(PUBLIC_THEMES).toContain(FALLBACK_PUBLIC_THEME)
  })
})
