import { describe, expect, it } from 'vitest'
import {
  formatWeddingDate,
  resolvePublicWeddingDate,
  toPublicSettings,
} from './public-settings'

describe('resolvePublicWeddingDate', () => {
  it('returns null when date is unset', () => {
    expect(
      resolvePublicWeddingDate({
        wedding_date: null,
        date_published_at: '2026-08-13T00:00:00.000Z',
      }),
    ).toBeNull()
  })

  it('returns null when date is draft / unpublished', () => {
    expect(
      resolvePublicWeddingDate({
        wedding_date: '2027-06-12',
        date_published_at: null,
      }),
    ).toBeNull()
  })

  it('returns the date when published', () => {
    expect(
      resolvePublicWeddingDate({
        wedding_date: '2027-06-12',
        date_published_at: '2026-08-13T00:00:00.000Z',
      }),
    ).toBe('2027-06-12')
  })
})

describe('toPublicSettings', () => {
  it('hides unpublished dates from public settings', () => {
    const publicSettings = toPublicSettings({
      groom_name: 'Marvelous',
      bride_name: 'Lillian',
      wedding_date: '2027-06-12',
      date_published_at: null,
      venue_name: null,
      venue_location: null,
      dress_code: null,
      active_public_theme: 'celeste',
      status: 'planning',
      public_slug: 'lillian-marvelous-2026',
    })

    expect(publicSettings.wedding_date).toBeNull()
    expect(formatWeddingDate(publicSettings.wedding_date)).toBe(
      'Date to be announced',
    )
  })
})
