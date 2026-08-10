/**
 * Shared UI / navigation constants.
 * Domain catalogs (themes, wedding statuses) stay in their dedicated modules.
 */

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
  to: '/admin' | '/admin/settings' | '/admin/admins'
  label: string
  exact: boolean
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin', label: 'Overview', exact: true },
  { to: '/admin/settings', label: 'Wedding settings', exact: false },
]

export const ADMIN_SUPER_NAV_ITEMS: readonly AdminNavItem[] = [
  { to: '/admin/admins', label: 'Admins', exact: false },
]

export function getAdminNavItems(isSuperAdmin: boolean): AdminNavItem[] {
  return isSuperAdmin
    ? [...ADMIN_NAV_ITEMS, ...ADMIN_SUPER_NAV_ITEMS]
    : [...ADMIN_NAV_ITEMS]
}

export const COLOR_MODES = ['light', 'dark'] as const
