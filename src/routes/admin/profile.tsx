import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { PhoneField } from '#/components/phone-field'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { toast } from '#/components/ui/toaster'
import { isSuperAdminProfile } from '#/lib/auth/roles'
import {
  requestAccountDeletion,
  updateProfile,
} from '#/lib/auth/profile'
import type { CountryCode } from '#/lib/auth/phone'
import { parseStoredPhone } from '#/lib/auth/phone'
import {
  adminFirstName,
  hasCompleteAdminName,
} from '#/lib/auth/types'
import { Route as AdminRoute } from './route'

export const Route = createFileRoute('/admin/profile')({
  component: AdminProfilePage,
})

function AdminProfilePage() {
  const { session } = AdminRoute.useRouteContext()
  const router = useRouter()

  if (!session) return null

  const isSuper = isSuperAdminProfile(session.profile)
  const needsName = !hasCompleteAdminName(session.profile)

  const [firstName, setFirstName] = useState(
    session.profile.first_name ?? '',
  )
  const [lastName, setLastName] = useState(session.profile.last_name ?? '')
  const [email, setEmail] = useState(
    session.profile.email ?? session.user.email ?? '',
  )
  const initialPhone = parseStoredPhone(session.profile.phone)
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(
    initialPhone.country,
  )
  const [phoneNational, setPhoneNational] = useState(
    initialPhone.nationalNumber,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const onSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      await updateProfile({
        data: {
          first_name: firstName,
          last_name: lastName,
          phone_country: phoneCountry,
          phone_national: phoneNational,
          ...(isSuper ? { email } : {}),
        },
      })
      toast.success('Profile updated.')
      await router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unable to save profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const onRequestDeletion = async () => {
    setIsDeleting(true)
    try {
      await requestAccountDeletion({ data: { reason: deleteReason } })
      toast.success(
        'Deletion request sent. A super admin will review it from Admins.',
      )
      setDeleteOpen(false)
      setDeleteReason('')
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to request deletion.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="admin-page-title">Profile</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          {needsName && !isSuper
            ? 'Add your first and last name to continue. This comes before wedding setup.'
            : `Hi ${adminFirstName(session.profile)} — update how you appear in admin.`}
        </p>
      </div>

      <form
        className="bg-surface border-border space-y-4 rounded-xl border p-5"
        onSubmit={onSave}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <Field.Label>First name</Field.Label>
            <Field.Control>
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
                autoComplete="given-name"
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
                autoComplete="family-name"
              />
            </Field.Control>
          </Field>
        </div>

        <Field>
          <Field.Label>Email</Field.Label>
          <Field.Control>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required={isSuper}
              readOnly={!isSuper}
              disabled={!isSuper}
              autoComplete="email"
            />
          </Field.Control>
          <Field.Description>
            {isSuper
              ? 'Changing email updates your sign-in address.'
              : 'Email is managed by the super admin. Use Support if you need it changed.'}
          </Field.Description>
        </Field>

        <PhoneField
          valueE164={session.profile.phone}
          onChange={({ country, nationalNumber }) => {
            setPhoneCountry(country)
            setPhoneNational(nationalNumber)
          }}
        />

        <Button type="submit" isLoading={isSaving}>
          Save profile
        </Button>
      </form>

      {!isSuper ? (
        <div className="bg-surface border-border space-y-4 rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Help & account
          </p>
          <p className="text-sm leading-relaxed">
            Need an email change or something else we can&apos;t edit here?{' '}
            <Link to="/admin/support" className="text-accent underline">
              Contact support
            </Link>
            .
          </p>

          {session.profile.deletion_requested_at ? (
            <p className="text-foreground-secondary text-sm">
              Deletion requested on{' '}
              {new Date(session.profile.deletion_requested_at).toLocaleString()}
              . A super admin still needs to remove the account.
            </p>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Request account deletion
            </Button>
          )}
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Request account deletion?"
        description="This cannot be undone from your side. A super admin will review the request and may permanently remove your access."
        confirmLabel="Send request"
        tone="destructive"
        isConfirming={isDeleting}
        onOpenChange={setDeleteOpen}
        onConfirm={onRequestDeletion}
      >
        <Field>
          <Field.Label>Reason</Field.Label>
          <Field.Control>
            <Textarea
              rows={4}
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder="Tell the super admin why you need this account removed."
              required
            />
          </Field.Control>
        </Field>
      </ConfirmDialog>
    </div>
  )
}
