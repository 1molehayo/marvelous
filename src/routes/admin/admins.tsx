import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'
import { toast } from '#/components/ui/toaster'
import { inviteAdmin, listAdmins, removeAdmin } from '#/lib/auth/admins'
import type { AdminListItem } from '#/lib/auth/admins'
import { requireSuperAdmin } from '#/lib/auth/require-access'
import { adminFullName } from '#/lib/auth/types'
import { internalError, raiseRouteError } from '#/lib/errors/route-error'

export const Route = createFileRoute('/admin/admins')({
  beforeLoad: ({ context }) => {
    requireSuperAdmin(context.session)
  },
  loader: async () => {
    try {
      return await listAdmins()
    } catch (cause) {
      throw raiseRouteError(
        internalError({
          message: 'Failed to load admin list for /admin/admins',
          cause,
        }),
        { source: 'server', pathname: '/admin/admins' },
      )
    }
  },
  component: AdminAdminsPage,
})

function AdminAdminsPage() {
  const initialAdmins = Route.useLoaderData()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminListItem[]>(initialAdmins)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    setAdmins(initialAdmins)
  }, [initialAdmins])

  const onInvite = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsInviting(true)
    try {
      await inviteAdmin({
        data: {
          email,
          first_name: firstName,
          last_name: lastName,
        },
      })
      setEmail('')
      setFirstName('')
      setLastName('')
      toast.success(
        'Admin invited. They can sign in at /admin/login with email + OTP.',
      )
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to invite admin.',
      )
    } finally {
      setIsInviting(false)
    }
  }

  const onRemove = async (adminId: string) => {
    setRemovingId(adminId)
    try {
      await removeAdmin({ data: { adminId } })
      toast.success('Admin removed.')
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to remove admin.',
      )
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="admin-page-title">Admins</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          Only you (super admin) can invite or remove admins. First and last
          name are required on invite. Deletion requests from admins show here.
        </p>
      </div>

      <form
        className="bg-surface border-border space-y-4 rounded-xl border p-5"
        onSubmit={onInvite}
      >
        <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
          Invite admin
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Field.Label>First name</Field.Label>
            <Field.Control>
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                autoComplete="off"
              />
            </Field.Control>
          </Field>
          <Field>
            <Field.Label>Last name</Field.Label>
            <Field.Control>
              <Input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                autoComplete="off"
              />
            </Field.Control>
          </Field>
        </div>
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
              className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{adminFullName(admin)}</p>
                <p className="text-foreground-secondary text-sm">
                  {admin.email ?? admin.id}
                </p>
                {admin.deletion_requested_at ? (
                  <div className="text-sm">
                    <Badge variant="warning">Deletion requested</Badge>
                    <p className="text-foreground-secondary mt-1">
                      {new Date(admin.deletion_requested_at).toLocaleString()}
                      {admin.deletion_reason
                        ? ` — ${admin.deletion_reason}`
                        : ''}
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={admin.role === 'super_admin' ? 'info' : 'neutral'}
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
    </div>
  )
}
