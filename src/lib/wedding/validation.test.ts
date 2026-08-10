import { describe, expect, it } from 'vitest'
import { parseUpdateWeddingInput } from './validation'

describe('parseUpdateWeddingInput', () => {
  it('accepts a full valid payload and trims strings', () => {
    const result = parseUpdateWeddingInput({
      groom_name: '  Marvelous ',
      bride_name: ' Lillian ',
      wedding_date: '2027-06-12',
      status: 'date_confirmed',
      venue_name: '  Garden Hall ',
      venue_location: ' Chicago ',
      dress_code: ' Formal attire ',
      active_public_theme: 'botanica',
    })

    expect(result).toEqual({
      groom_name: 'Marvelous',
      bride_name: 'Lillian',
      wedding_date: '2027-06-12',
      status: 'date_confirmed',
      venue_name: 'Garden Hall',
      venue_location: 'Chicago',
      dress_code: 'Formal attire',
      active_public_theme: 'botanica',
    })
  })

  it('allows a null wedding date and empty optional fields', () => {
    const result = parseUpdateWeddingInput({
      groom_name: 'Marvelous',
      bride_name: 'Lillian',
      wedding_date: '',
      status: 'planning',
      venue_name: '   ',
      venue_location: null,
      dress_code: undefined,
      active_public_theme: 'celeste',
    })

    expect(result.wedding_date).toBeNull()
    expect(result.venue_name).toBeNull()
    expect(result.venue_location).toBeNull()
    expect(result.dress_code).toBeNull()
  })

  it('rejects an invented placeholder-like invalid date', () => {
    expect(() =>
      parseUpdateWeddingInput({
        groom_name: 'Marvelous',
        bride_name: 'Lillian',
        wedding_date: '2027-13-40',
        status: 'planning',
        venue_name: null,
        venue_location: null,
        dress_code: null,
        active_public_theme: 'celeste',
      }),
    ).toThrow(/invalid|YYYY-MM-DD/i)
  })

  it('rejects unknown themes and statuses', () => {
    expect(() =>
      parseUpdateWeddingInput({
        groom_name: 'Marvelous',
        bride_name: 'Lillian',
        wedding_date: null,
        status: 'draft',
        venue_name: null,
        venue_location: null,
        dress_code: null,
        active_public_theme: 'celeste',
      }),
    ).toThrow(/status/i)

    expect(() =>
      parseUpdateWeddingInput({
        groom_name: 'Marvelous',
        bride_name: 'Lillian',
        wedding_date: null,
        status: 'planning',
        venue_name: null,
        venue_location: null,
        dress_code: null,
        active_public_theme: 'lavender',
      }),
    ).toThrow(/theme/i)
  })
})
