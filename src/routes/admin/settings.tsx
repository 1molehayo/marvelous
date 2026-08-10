import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input, inputStyle } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { PUBLIC_THEME_META, PUBLIC_THEMES } from '#/lib/site-settings'
import type { PublicThemeId } from '#/lib/site-settings'
import type { Wedding, WeddingStatus } from '#/lib/supabase/types'
import { updateWedding } from '#/lib/wedding/settings'
import {
  WEDDING_STATUS_LABELS,
  WEDDING_STATUSES,
} from '#/lib/wedding/validation'
import { cn } from '#/lib/utils'
import { Route as AdminRoute } from './route'

export const Route = createFileRoute('/admin/settings')({
  component: AdminWeddingSettingsPage,
})

type FormState = {
  partner_one_name: string
  partner_two_name: string
  wedding_date: string
  status: WeddingStatus
  venue_name: string
  venue_location: string
  dress_code: string
  active_public_theme: PublicThemeId
}

function weddingToForm(wedding: Wedding): FormState {
  return {
    partner_one_name: wedding.partner_one_name,
    partner_two_name: wedding.partner_two_name,
    wedding_date: wedding.wedding_date ?? '',
    status: wedding.status,
    venue_name: wedding.venue_name ?? '',
    venue_location: wedding.venue_location ?? '',
    dress_code: wedding.dress_code ?? '',
    active_public_theme: wedding.active_public_theme,
  }
}

function AdminWeddingSettingsPage() {
  const { session } = AdminRoute.useRouteContext()
  const router = useRouter()

  if (!session) {
    return null
  }

  const [form, setForm] = useState<FormState>(() =>
    weddingToForm(session.wedding),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setField = <TKey extends keyof FormState>(
    key: TKey,
    value: FormState[TKey],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      const wedding = await updateWedding({
        data: {
          partner_one_name: form.partner_one_name,
          partner_two_name: form.partner_two_name,
          wedding_date: form.wedding_date || null,
          status: form.status,
          venue_name: form.venue_name || null,
          venue_location: form.venue_location || null,
          dress_code: form.dress_code || null,
          active_public_theme: form.active_public_theme,
        },
      })
      setForm(weddingToForm(wedding))
      setSuccess('Wedding settings saved.')
      await router.invalidate()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save wedding settings.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="admin-page-title">Wedding settings</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          Couple details, venue, dress code, public theme, and status. Page
          blocks (reorderable sections) arrive in Phase 4b.
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="bg-surface border-border space-y-4 rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Couple
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Field.Label>Partner one</Field.Label>
              <Field.Control>
                <Input
                  value={form.partner_one_name}
                  onChange={(event) =>
                    setField('partner_one_name', event.target.value)
                  }
                  required
                />
              </Field.Control>
            </Field>
            <Field>
              <Field.Label>Partner two</Field.Label>
              <Field.Control>
                <Input
                  value={form.partner_two_name}
                  onChange={(event) =>
                    setField('partner_two_name', event.target.value)
                  }
                  required
                />
              </Field.Control>
            </Field>
          </div>
        </div>

        <div className="bg-surface border-border space-y-4 rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Date &amp; status
          </p>
          <Field>
            <Field.Label>Wedding date</Field.Label>
            <Field.Control>
              <Input
                type="date"
                value={form.wedding_date}
                onChange={(event) =>
                  setField('wedding_date', event.target.value)
                }
              />
            </Field.Control>
            <Field.Description>
              Leave empty for “date to be announced”. Never invent a placeholder
              date.
            </Field.Description>
          </Field>
          <Field>
            <Field.Label>Status</Field.Label>
            <Field.Control>
              <select
                className={cn(inputStyle())}
                value={form.status}
                onChange={(event) =>
                  setField('status', event.target.value as WeddingStatus)
                }
              >
                {WEDDING_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {WEDDING_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </Field.Control>
          </Field>
        </div>

        <div className="bg-surface border-border space-y-4 rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Venue &amp; attire
          </p>
          <Field>
            <Field.Label>Venue name</Field.Label>
            <Field.Control>
              <Input
                value={form.venue_name}
                onChange={(event) => setField('venue_name', event.target.value)}
              />
            </Field.Control>
          </Field>
          <Field>
            <Field.Label>Venue location</Field.Label>
            <Field.Control>
              <Input
                value={form.venue_location}
                onChange={(event) =>
                  setField('venue_location', event.target.value)
                }
              />
            </Field.Control>
          </Field>
          <Field>
            <Field.Label>Dress code</Field.Label>
            <Field.Control>
              <Textarea
                rows={3}
                value={form.dress_code}
                onChange={(event) => setField('dress_code', event.target.value)}
              />
            </Field.Control>
          </Field>
        </div>

        <div className="bg-surface border-border space-y-4 rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Public theme
          </p>
          <Field>
            <Field.Label>Active theme</Field.Label>
            <Field.Control>
              <select
                className={cn(inputStyle())}
                value={form.active_public_theme}
                onChange={(event) =>
                  setField(
                    'active_public_theme',
                    event.target.value as PublicThemeId,
                  )
                }
              >
                {PUBLIC_THEMES.map((themeId) => (
                  <option key={themeId} value={themeId}>
                    {PUBLIC_THEME_META[themeId].name}
                  </option>
                ))}
              </select>
            </Field.Control>
            <Field.Description>
              {PUBLIC_THEME_META[form.active_public_theme].description} Visitors
              can still toggle light/dark.
            </Field.Description>
          </Field>
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

        <Button type="submit" isLoading={isSubmitting}>
          Save settings
        </Button>
      </form>
    </div>
  )
}
