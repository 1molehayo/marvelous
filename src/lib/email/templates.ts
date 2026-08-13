import { getAppUrl } from '#/lib/app-url'
import { PRODUCT_NAME } from '#/lib/constants'

export { getAppUrl }

export function adminInviteAcceptUrl(token: string): string {
  return `${getAppUrl()}/admin/invite/${encodeURIComponent(token)}`
}

export function newInviteToken(): string {
  return crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
}

export function inviteEmailHtml(input: {
  adminName: string
  acceptUrl: string
  coupleLabel: string | null
}): string {
  const weddingLine = input.coupleLabel
    ? `<p>You’ve been invited to help manage the wedding website for <strong>${escapeHtml(input.coupleLabel)}</strong>.</p>`
    : `<p>You’ve been invited to help manage a wedding website on ${escapeHtml(PRODUCT_NAME)}.</p>`

  return `<!doctype html>
<html>
  <body style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.5;">
    <h2 style="font-weight: 400; font-style: italic;">You’re invited</h2>
    <p>Hi ${escapeHtml(input.adminName)},</p>
    ${weddingLine}
    <p>
      <a href="${escapeAttr(input.acceptUrl)}" style="display:inline-block;padding:12px 20px;background:#2c3e50;color:#fff;text-decoration:none;border-radius:8px;">
        Accept invitation
      </a>
    </p>
    <p style="font-size: 14px; color: #555;">Or open this link:<br/>
      <a href="${escapeAttr(input.acceptUrl)}">${escapeHtml(input.acceptUrl)}</a>
    </p>
    <p style="font-size: 13px; color: #777;">If you weren’t expecting this, you can ignore this email.</p>
  </body>
</html>`
}

export function inviteEmailText(input: {
  adminName: string
  acceptUrl: string
  coupleLabel: string | null
}): string {
  const weddingLine = input.coupleLabel
    ? `You’ve been invited to help manage the wedding website for ${input.coupleLabel}.`
    : `You’ve been invited to help manage a wedding website on ${PRODUCT_NAME}.`

  return [
    `Hi ${input.adminName},`,
    '',
    weddingLine,
    '',
    `Accept your invitation:`,
    input.acceptUrl,
    '',
    `If you weren’t expecting this, you can ignore this email.`,
  ].join('\n')
}

export type GuestRsvpInviteEmailInput = {
  guestName: string
  coupleLabel: string
  weddingDateLabel: string
  websiteUrl: string | null
  rsvpUrl: string
  photosUrl: string | null
}

export function guestRsvpInviteEmailHtml(
  input: GuestRsvpInviteEmailInput,
): string {
  const websiteBlock = input.websiteUrl
    ? `<p>Wedding website:<br/>
      <a href="${escapeAttr(input.websiteUrl)}">${escapeHtml(input.websiteUrl)}</a>
    </p>`
    : ''

  const photosBlock = input.photosUrl
    ? `<p>We’ve also shared a private photo album with you:<br/>
      <a href="${escapeAttr(input.photosUrl)}" style="display:inline-block;padding:10px 16px;background:#5c4a3a;color:#fff;text-decoration:none;border-radius:8px;">
        View private photos
      </a>
    </p>
    <p style="font-size: 14px; color: #555;">Or open:<br/>
      <a href="${escapeAttr(input.photosUrl)}">${escapeHtml(input.photosUrl)}</a>
    </p>`
    : ''

  return `<!doctype html>
<html>
  <body style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.5;">
    <h2 style="font-weight: 400; font-style: italic;">You’re invited</h2>
    <p>Hi ${escapeHtml(input.guestName)},</p>
    <p>
      You’re warmly invited to celebrate with
      <strong>${escapeHtml(input.coupleLabel)}</strong>
      on ${escapeHtml(input.weddingDateLabel)}.
    </p>
    ${websiteBlock}
    <p>Please RSVP with your personal link:</p>
    <p>
      <a href="${escapeAttr(input.rsvpUrl)}" style="display:inline-block;padding:12px 20px;background:#2c3e50;color:#fff;text-decoration:none;border-radius:8px;">
        RSVP now
      </a>
    </p>
    <p style="font-size: 14px; color: #555;">Or open this link:<br/>
      <a href="${escapeAttr(input.rsvpUrl)}">${escapeHtml(input.rsvpUrl)}</a>
    </p>
    ${photosBlock}
    <p style="font-size: 13px; color: #777;">This link is just for you. Please don’t share it widely.</p>
  </body>
</html>`
}

export function guestRsvpInviteEmailText(
  input: GuestRsvpInviteEmailInput,
): string {
  const lines = [
    `Hi ${input.guestName},`,
    '',
    `You’re warmly invited to celebrate with ${input.coupleLabel} on ${input.weddingDateLabel}.`,
    '',
  ]

  if (input.websiteUrl) {
    lines.push(`Wedding website: ${input.websiteUrl}`, '')
  }

  lines.push('Please RSVP with your personal link:', input.rsvpUrl, '')

  if (input.photosUrl) {
    lines.push(
      'We’ve also shared a private photo album with you:',
      input.photosUrl,
      '',
    )
  }

  lines.push('This link is just for you. Please don’t share it widely.')
  return lines.join('\n')
}

export type GuestPhotoShareEmailInput = {
  guestName: string
  coupleLabel: string
  shareName: string
  photosUrl: string
}

export function guestPhotoShareEmailHtml(
  input: GuestPhotoShareEmailInput,
): string {
  return `<!doctype html>
<html>
  <body style="font-family: Georgia, serif; color: #1a1a1a; line-height: 1.5;">
    <h2 style="font-weight: 400; font-style: italic;">Private photos</h2>
    <p>Hi ${escapeHtml(input.guestName)},</p>
    <p>
      <strong>${escapeHtml(input.coupleLabel)}</strong> shared a private photo album
      with you: <em>${escapeHtml(input.shareName)}</em>.
    </p>
    <p>
      <a href="${escapeAttr(input.photosUrl)}" style="display:inline-block;padding:12px 20px;background:#5c4a3a;color:#fff;text-decoration:none;border-radius:8px;">
        View photos
      </a>
    </p>
    <p style="font-size: 14px; color: #555;">Or open this link:<br/>
      <a href="${escapeAttr(input.photosUrl)}">${escapeHtml(input.photosUrl)}</a>
    </p>
    <p style="font-size: 13px; color: #777;">This album is private. Please don’t share the link widely.</p>
  </body>
</html>`
}

export function guestPhotoShareEmailText(
  input: GuestPhotoShareEmailInput,
): string {
  return [
    `Hi ${input.guestName},`,
    '',
    `${input.coupleLabel} shared a private photo album with you: ${input.shareName}.`,
    '',
    `View photos:`,
    input.photosUrl,
    '',
    `This album is private. Please don’t share the link widely.`,
  ].join('\n')
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;')
}
