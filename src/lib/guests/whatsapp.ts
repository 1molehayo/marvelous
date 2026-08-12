/** Build a WhatsApp share URL with a prefilled RSVP invite message. */
export function whatsappRsvpShareUrl(input: {
  phone: string
  guestFirstName: string
  coupleLabel: string
  rsvpUrl: string
}): string | null {
  const digits = input.phone.replace(/\D/g, '')
  if (digits.length < 8) return null

  const message = [
    `Hi ${input.guestFirstName},`,
    '',
    `You’re invited to celebrate ${input.coupleLabel}.`,
    '',
    `Please RSVP here:`,
    input.rsvpUrl,
  ].join('\n')

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
