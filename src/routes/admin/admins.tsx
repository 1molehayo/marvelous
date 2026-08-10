import {
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { isSuperAdminProfile } from '#/lib/auth/roles'
import {
  inviteAdmin,
  listAdmins,
  removeAdmin,
} from '#/lib/auth/admins'
import type { AdminListItem } from '#/lib/auth/admins'

export const Route = createFileRoute('/admin/admins')({
  beforeLoad: ({ context }) => {
    const session = context.session
    if (!session || !isSuperAdminProfile(session.profile)) {
      throw redirect({ to: '/admin' })
    }
  },
  loader: () => listAdmins(),
  component: AdminAdminsPage,
})

function AdminAdminsPage() {
  const initialAdmins = Route.useLoaderData()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminListItem[]>(initialAdmins)
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isInviting, setIsInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    setAdmins(initialAdmins)
  }, [initialAdmins])

  const onInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsInviting(true)
    try {
      await inviteAdmin({
        data: {
          email,
          display_name: displayName || undefined,
        },
      })
      setEmail('')
      setDisplayName('')
      setSuccess(
        'Admin invited. They can sign in at /admin/login with email + OTP.',
      )
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to invite admin.')
    } finally {
      setIsInviting(false)
    }
  }

  const onRemove = async (adminId: string) => {
    setError(null)
    setSuccess(null)
    setRemovingId(adminId)
    try {
      await removeAdmin({ data: { adminId } })
      setSuccess('Admin removed.')
      await router.invalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove admin.')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="admin-page-title">Admins</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          Only you (super admin) can invite or remove admins. Invited admins
          sign in with email + one-time code — no password to share.
        </p>
      </div>

      <form
        className="bg-surface border-border space-y-4 rounded-xl border p-5"
        onSubmit={onInvite}
      >
        <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
          Invite admin
        </p>
        <Field>
          <Field.Label>Email</Field.Label>
          <Field.Control>
            <Input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field.Control>
        </Field>
        <Field>
          <Field.Label>Display name</Field.Label>
          <Field.Control>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Optional"
            />
          </Field.Control>
        </Field>
        <Button type="submit" isLoading={isInviting}>
          Invite admin
        </Button>
      </form>

      <div className="bg-surface border-border space-y-3 rounded-xl border p-5">
        <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
          Current admins
        </p>
        <ul className="divide-border divide-y">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="font-medium">
                  {admin.display_name ?? admin.email ?? 'Admin'}
                </p>
                <p className="text-foreground-secondary text-sm">
                  {admin.email ?? admin.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    admin.role === 'super_admin' ? 'info' : 'neutral'
                  }
                >
                  {admin.role === 'super_admin' ? 'Super admin' : 'Admin'}
                </Badge>
                {admin.role === 'admin' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={removingId === admin.id}
                    onClick={() => onRemove(admin.id)}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {error ? (
        <p className="text-error text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-success text-sm" role="status">
          {success}
        </p>
      ) : null}
    </div>
  )
}
