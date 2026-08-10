import { COLOR_MODE_STORAGE_KEY } from '#/lib/site-settings'
import type { ColorMode } from '#/lib/site-settings'

export function getStoredColorMode(): ColorMode | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

export function resolveInitialColorMode(): ColorMode {
  const stored = getStoredColorMode()
  if (stored) return stored
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}

export function syncThemeColorMeta() {
  if (typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  const background = getComputedStyle(document.body).backgroundColor
  if (background) meta.setAttribute('content', background)
}

export function applyColorMode(mode: ColorMode) {
  document.documentElement.dataset.mode = mode
  document.documentElement.style.colorScheme = mode
  // Wait a frame so theme CSS variables resolve for the new mode.
  requestAnimationFrame(() => syncThemeColorMeta())
}

export function persistColorMode(mode: ColorMode) {
  window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode)
  applyColorMode(mode)
}

/** Inline script for FOUC-free color mode before React hydrates. */
export const COLOR_MODE_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(COLOR_MODE_STORAGE_KEY)};var s=localStorage.getItem(k);var m=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var r=document.documentElement;r.dataset.mode=m;r.style.colorScheme=m;requestAnimationFrame(function(){var meta=document.querySelector('meta[name="theme-color"]');if(!meta)return;var bg=getComputedStyle(document.body).backgroundColor;if(bg)meta.setAttribute('content',bg);});}catch(e){}})();`
