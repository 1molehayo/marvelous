import { z } from 'zod'
import type { Guest } from '#/lib/supabase/types'

const requiredName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(80, `${label} must be 80 characters or fewer.`)

const optionalText = (label: string, max = 200) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) return null
      const trimmed = value.trim()
      return trimmed.length === 0 ? null : trimmed
    })
    .refine((value) => value === null || value.length <= max, {
      message: `${label} must be ${max} characters or fewer.`,
    })

export const guestFormSchema = z.object({
  firstName: requiredName('First name'),
  lastName: requiredName('Last name'),
  email: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((value) => {
      if (value === null || value === undefined) return null
      const trimmed = value.trim().toLowerCase()
      return trimmed.length === 0 ? null : trimmed
    })
    .refine((value) => value === null || value.includes('@'), {
      message: 'Enter a valid email.',
    }),
  phone: optionalText('Phone', 40),
  partyName: optionalText('Party name', 120),
  plusOnes: z.coerce
    .number()
    .int('Plus-ones must be a whole number.')
    .min(0, 'Plus-ones cannot be negative.')
    .max(20, 'Plus-ones must be 20 or fewer.'),
  notes: optionalText('Notes', 2000),
})

export type GuestFormValues = z.infer<typeof guestFormSchema>

export type GuestInput = {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  party_name: string | null
  plus_ones: number
  notes: string | null
}

export function parseGuestInput(data: unknown): GuestInput {
  const record =
    typeof data === 'object' && data !== null
      ? (data as Record<string, unknown>)
      : {}

  const parsed = guestFormSchema.safeParse({
    firstName: record.first_name ?? record.firstName ?? '',
    lastName: record.last_name ?? record.lastName ?? '',
    email: record.email,
    phone: record.phone,
    partyName: record.party_name ?? record.partyName,
    plusOnes: record.plus_ones ?? record.plusOnes ?? 0,
    notes: record.notes,
  })

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Invalid guest.')
  }

  return {
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    party_name: parsed.data.partyName,
    plus_ones: parsed.data.plusOnes,
    notes: parsed.data.notes,
  }
}

export function guestFullName(
  guest: Pick<Guest, 'first_name' | 'last_name'>,
): string {
  return `${guest.first_name} ${guest.last_name}`.trim()
}

export function toGuestFormValues(guest: Guest): GuestFormValues {
  return {
    firstName: guest.first_name,
    lastName: guest.last_name,
    email: guest.email ?? '',
    phone: guest.phone ?? '',
    partyName: guest.party_name ?? '',
    plusOnes: guest.plus_ones,
    notes: guest.notes ?? '',
  }
}
