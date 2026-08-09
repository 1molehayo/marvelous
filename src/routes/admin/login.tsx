import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { getAdminSession, loginAdmin } from '#/lib/auth/session'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await loginAdmin({ data: { email, password } })
      await navigate({ to: '/admin' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-surface="admin"
      className="bg-background text-foreground flex min-h-dvh items-center justify-center px-4 py-12"
    >
      <div className="bg-surface border-border w-full max-w-md space-y-6 rounded-2xl border p-6 shadow-sm md:p-8">
        <div className="space-y-2">
          <Badge>Admin</Badge>
          <h1 className="admin-page-title">Sign in</h1>
          <p className="text-foreground-secondary text-sm">
            Admins are invited via the Supabase Dashboard. There is no public
            sign-up.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
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

          <Field>
            <Field.Label>Password</Field.Label>
            <Field.Control>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field.Control>
          </Field>

          {error ? (
            <p className="text-error text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
