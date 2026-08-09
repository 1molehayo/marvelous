import { describe, expect, it } from 'vitest'
import {
  ACTIVE_PUBLIC_THEME,
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

  it('uses a known active public theme stub', () => {
    expect(PUBLIC_THEMES).toContain(ACTIVE_PUBLIC_THEME)
  })
})
