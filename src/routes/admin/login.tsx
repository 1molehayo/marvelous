import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import {
  getAdminSession,
  requestAdminOtp,
  verifyAdminOtp,
} from '#/lib/auth/session'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Toaster, toast } from '#/components/ui/toaster'

function isLocalSupabaseUrl(url: string | undefined) {
  if (!url) return false
  return (
    url.includes('127.0.0.1') ||
    url.includes('localhost') ||
    url.includes('0.0.0.0')
  )
}

export const Route = createFileRoute('/admin/login')({
  beforeLoad: async () => {
    const session = await getAdminSession()
    if (session) {
      throw redirect({ to: '/admin' })
    }
  },
  component: AdminLoginPage,
})

function AdminLoginPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const localAuth = isLocalSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)

  const onRequestCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await requestAdminOtp({ data: { email } })
      setEmail(result.email)
      setStep('otp')
      toast.success(
        localAuth
          ? 'Code sent. Open Mailpit at http://127.0.0.1:54324'
          : 'Check your email for a 6-digit code.',
      )
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to send code.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const onVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await verifyAdminOtp({ data: { email, token } })
      await navigate({ to: '/admin' })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to verify code.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-surface="admin"
      className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-12"
    >
      <Toaster />
      <div className="bg-surface border-border w-full max-w-md space-y-6 rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Admin</Badge>
            <Badge variant={localAuth ? 'info' : 'warning'}>
              {localAuth ? 'Local · Mailpit' : 'Cloud Supabase'}
            </Badge>
          </div>
          <h1 className="admin-page-title">Sign in</h1>
          <p className="text-foreground-secondary text-sm">
            Email-only sign-in with a one-time code. Only authorized admins can
            request a code.
            {localAuth
              ? ' Local whitelist: superadmin@supabase.com or admin@supabase.com (OTP in Mailpit).'
              : ' Using cloud Auth — enable Email provider in the Supabase Dashboard if codes fail.'}
          </p>
        </div>

        {step === 'email' ? (
          <form className="space-y-4" onSubmit={onRequestCode}>
            <Field>
              <Field.Label>Email</Field.Label>
              <Field.Control>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </Field.Control>
            </Field>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Send code
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={onVerifyCode}>
            <p className="text-foreground-secondary text-sm">
              Code sent to <span className="text-foreground">{email}</span>
            </p>
            <Field>
              <Field.Label>One-time code</Field.Label>
              <Field.Control>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={token}
                  onChange={(event) =>
                    setToken(event.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  required
                />
              </Field.Control>
              <Field.Description>
                Locally, open Mailpit at http://localhost:54324 (also listed in
                `supabase status`) to read the code.
              </Field.Description>
            </Field>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Verify &amp; sign in
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={isSubmitting}
              onClick={() => {
                setStep('email')
                setToken('')
              }}
            >
              Use a different email
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
