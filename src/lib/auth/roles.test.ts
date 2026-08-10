import { describe, expect, it } from 'vitest'
import {
  LOCAL_ADMIN_EMAIL,
  LOCAL_SUPER_ADMIN_EMAIL,
  PRODUCTION_SUPER_ADMIN_EMAIL,
  getLocalBootstrapRole,
  getSuperAdminEmail,
  isLocalAllowedEmail,
  isReservedSuperAdminEmail,
  isSuperAdminEmail,
  isSuperAdminProfile,
  normalizeAdminEmail,
} from './roles'

describe('admin roles', () => {
  it('resolves super admin email by environment', () => {
    expect(getSuperAdminEmail(false)).toBe(PRODUCTION_SUPER_ADMIN_EMAIL)
    expect(getSuperAdminEmail(true)).toBe(LOCAL_SUPER_ADMIN_EMAIL)
    expect(isSuperAdminEmail(PRODUCTION_SUPER_ADMIN_EMAIL, false)).toBe(true)
    expect(isSuperAdminEmail(LOCAL_SUPER_ADMIN_EMAIL, true)).toBe(true)
    expect(isSuperAdminEmail(PRODUCTION_SUPER_ADMIN_EMAIL, true)).toBe(false)
    expect(isSuperAdminEmail(null)).toBe(false)
  })

  it('whitelists only the two local test emails', () => {
    expect(isLocalAllowedEmail(LOCAL_SUPER_ADMIN_EMAIL)).toBe(true)
    expect(isLocalAllowedEmail(LOCAL_ADMIN_EMAIL)).toBe(true)
    expect(isLocalAllowedEmail(PRODUCTION_SUPER_ADMIN_EMAIL)).toBe(false)
    expect(isLocalAllowedEmail('other@example.com')).toBe(false)
  })

  it('bootstraps local roles for the designated test emails', () => {
    expect(getLocalBootstrapRole(LOCAL_SUPER_ADMIN_EMAIL)).toBe('super_admin')
    expect(getLocalBootstrapRole(LOCAL_ADMIN_EMAIL)).toBe('admin')
    expect(getLocalBootstrapRole('other@example.com')).toBeNull()
  })

  it('protects both reserved super admin addresses', () => {
    expect(isReservedSuperAdminEmail(PRODUCTION_SUPER_ADMIN_EMAIL)).toBe(true)
    expect(isReservedSuperAdminEmail(LOCAL_SUPER_ADMIN_EMAIL)).toBe(true)
    expect(isReservedSuperAdminEmail(LOCAL_ADMIN_EMAIL)).toBe(false)
  })

  it('normalizes emails for comparison', () => {
    expect(normalizeAdminEmail('  Ada@Example.COM ')).toBe('ada@example.com')
  })

  it('treats profile role as the source of truth after bootstrap', () => {
    expect(isSuperAdminProfile({ role: 'super_admin' })).toBe(true)
    expect(isSuperAdminProfile({ role: 'admin' })).toBe(false)
  })
})
