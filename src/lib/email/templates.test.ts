import { describe, expect, it } from 'vitest'
import {
  guestPhotoShareEmailText,
  guestRsvpInviteEmailText,
} from '#/lib/email/templates'

describe('guest email templates', () => {
  it('includes RSVP and optional photo links in text', () => {
    const text = guestRsvpInviteEmailText({
      guestName: 'Ada',
      coupleLabel: 'Marvelous & Lillian',
      weddingDateLabel: 'August 15, 2026',
      websiteUrl: 'https://example.com/lillian-marvelous-2026',
      rsvpUrl: 'https://example.com/rsvp/token123',
      photosUrl: 'https://example.com/photos/share?g=token123',
    })

    expect(text).toContain('Hi Ada,')
    expect(text).toContain('Marvelous & Lillian')
    expect(text).toContain('https://example.com/rsvp/token123')
    expect(text).toContain('https://example.com/photos/share?g=token123')
    expect(text).toContain('https://example.com/lillian-marvelous-2026')
  })

  it('omits photo and website lines when null', () => {
    const text = guestRsvpInviteEmailText({
      guestName: 'Ada',
      coupleLabel: 'Marvelous & Lillian',
      weddingDateLabel: 'Date to be announced',
      websiteUrl: null,
      rsvpUrl: 'https://example.com/rsvp/token123',
      photosUrl: null,
    })

    expect(text).toContain('https://example.com/rsvp/token123')
    expect(text).not.toContain('Wedding website:')
    expect(text).not.toContain('private photo album')
  })

  it('builds photo-share email text', () => {
    const text = guestPhotoShareEmailText({
      guestName: 'Ada',
      coupleLabel: 'Marvelous & Lillian',
      shareName: 'Engagement set',
      photosUrl: 'https://example.com/photos/share?g=token123',
    })

    expect(text).toContain('Engagement set')
    expect(text).toContain('https://example.com/photos/share?g=token123')
  })
})
