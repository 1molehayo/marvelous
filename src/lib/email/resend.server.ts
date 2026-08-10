import { Resend } from 'resend'
import {
  getSuperAdminEmail,
  PRODUCTION_SUPER_ADMIN_EMAIL,
} from '#/lib/auth/roles'
import { isLocalSupabase } from '#/lib/supabase/env'
import { PRODUCT_NAME } from '#/lib/constants'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      'Email is not configured (missing RESEND_API_KEY). Add it on Vercel to send support mail.',
    )
  }
  return new Resend(apiKey)
}

function supportFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'Wedding Website Builder <onboarding@resend.dev>'
  )
}

function superAdminInbox() {
  return getSuperAdminEmail(isLocalSupabase())
}

export type SupportEmailInput = {
  category: string
  categoryLabel: string
  message: string
  adminName: string
  adminEmail: string
  adminRole: string
  weddingLabel: string | null
  attachment?: {
    filename: string
    contentBase64: string
    contentType: string
  } | null
}

export async function sendSupportEmail(input: SupportEmailInput) {
  const resend = getResendClient()
  const subject = `[${PRODUCT_NAME}] Support: ${input.categoryLabel} — ${input.adminName}`

  const text = [
    `Category: ${input.categoryLabel} (${input.category})`,
    `From: ${input.adminName} <${input.adminEmail}>`,
    `Role: ${input.adminRole}`,
    `Wedding: ${input.weddingLabel ?? 'None'}`,
    '',
    input.message,
  ].join('\n')

  const attachments = input.attachment
    ? [
        {
          filename: input.attachment.filename,
          content: Buffer.from(input.attachment.contentBase64, 'base64'),
          contentType: input.attachment.contentType,
        },
      ]
    : undefined

  const result = await resend.emails.send({
    from: supportFromAddress(),
    to: [superAdminInbox()],
    replyTo: input.adminEmail,
    subject,
    text,
    attachments,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { ok: true as const, id: result.data.id }
}

export type DeletionRequestEmailInput = {
  adminName: string
  adminEmail: string
  reason: string
  weddingLabel: string | null
}

export async function sendDeletionRequestEmail(
  input: DeletionRequestEmailInput,
) {
  const resend = getResendClient()
  const subject = `[${PRODUCT_NAME}] Account deletion request — ${input.adminName}`

  const text = [
    'An admin requested deletion of their account.',
    '',
    `Name: ${input.adminName}`,
    `Email: ${input.adminEmail}`,
    `Wedding: ${input.weddingLabel ?? 'None'}`,
    '',
    'Reason:',
    input.reason,
    '',
    `Review and remove them from Admins if appropriate.`,
    `Super admin inbox: ${PRODUCTION_SUPER_ADMIN_EMAIL}`,
  ].join('\n')

  const result = await resend.emails.send({
    from: supportFromAddress(),
    to: [superAdminInbox()],
    replyTo: input.adminEmail,
    subject,
    text,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return { ok: true as const, id: result.data.id }
}
