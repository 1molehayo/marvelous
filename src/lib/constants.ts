/**
 * Shared UI / navigation / product branding constants.
 * Domain catalogs (themes, wedding statuses) stay in their dedicated modules.
 */

/** Product brand (Onemole) — not the couple names. */
export const PRODUCT_NAME = 'Wedding Website Builder'
export const PRODUCT_SHORT_NAME = 'Onemole'
export const PRODUCT_TAGLINE = 'Wedding websites'

export const ADMIN_PREVIEW_NAV_LABELS = [
  'Overview',
  'Guests',
  'RSVPs',
  'Story',
  'Photos',
  'Guest photos',
  'Registry',
  'Website',
] as const

export type AdminNavItem = {
  to:
    | '/admin'
    | '/admin/settings'
    | '/admin/pages'
    | '/admin/admins'
    | '/admin/onboarding'
  label: string
  exact: boolean
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/settings', label: 'Wedding settings', exact: false },
  { to: '/admin/pages', label: 'Page content', exact: false },
]

export const ADMIN_SUPER_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin/admins', label: 'Admins', exact: false },
]

export function getAdminNavItems(
  isSuperAdmin: boolean,
  options?: { hasWedding?: boolean },
): AdminNavItem[] {
  const hasWedding = options?.hasWedding ?? true

  if (!hasWedding) {
    const items: AdminNavItem[] = [
      { to: '/admin', label: 'Overview', exact: true },
      { to: '/admin/onboarding', label: 'Set up wedding', exact: false },
    ]
    if (isSuperAdmin) {
      items.push(...ADMIN_SUPER_NAV_ITEMS)
    }
    return items
  }

  return isSuperAdmin
    ? [...ADMIN_NAV_ITEMS, ...ADMIN_SUPER_NAV_ITEMS]
    : [...ADMIN_NAV_ITEMS]
}

export function formatCoupleNames(groomName: string, brideName: string) {
  return `${groomName} & ${brideName}`
}

export const COLOR_MODES = ['light', 'dark'] as const
