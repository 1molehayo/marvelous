import { PRODUCT_NAME } from '#/lib/constants'

/** Public app origin for invite / email links. */
export function getAppUrl(): string {
  const fromEnv =
    process.env.APP_URL?.trim() ||
    process.env.VITE_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (fromEnv) {
    return fromEnv.startsWith('http') ? fromEnv.replace(/\/$/, '') : `https://${fromEnv.replace(/\/$/, '')}`
  }
  return 'http://localhost:3000'
}

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
