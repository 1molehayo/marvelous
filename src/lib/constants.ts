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
    | '/admin/profile'
    | '/admin/support'
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

export const ADMIN_ACCOUNT_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin/profile', label: 'Profile', exact: false },
]

export const ADMIN_SUPPORT_NAV_ITEM: AdminNavItem = {
  to: '/admin/support',
  label: 'Support',
  exact: false,
}

export function getAdminNavItems(
  isSuperAdmin: boolean,
  options?: { hasWedding?: boolean },
): AdminNavItem[] {
  const hasWedding = options?.hasWedding ?? true
  const items: AdminNavItem[] = []

  if (!hasWedding) {
    items.push(
      { to: '/admin', label: 'Overview', exact: true },
      { to: '/admin/onboarding', label: 'Wedding settings', exact: false },
    )
  } else {
    items.push(...ADMIN_NAV_ITEMS)
  }

  if (isSuperAdmin) {
    items.push(...ADMIN_SUPER_NAV_ITEMS)
  } else {
    items.push(ADMIN_SUPPORT_NAV_ITEM)
  }

  items.push(...ADMIN_ACCOUNT_NAV_ITEMS)
  return items
}

export function formatCoupleNames(groomName: string, brideName: string) {
  return `${groomName} & ${brideName}`
}

export const COLOR_MODES = ['light', 'dark'] as const
