import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { toast } from '#/components/ui/toaster'
import { PUBLIC_THEME_META, PUBLIC_THEMES } from '#/lib/site-settings'
import type { PublicThemeId } from '#/lib/site-settings'
import type { Wedding, WeddingStatus } from '#/lib/supabase/types'
import { updateWedding } from '#/lib/wedding/settings'
import {
  WEDDING_STATUS_LABELS,
  WEDDING_STATUSES,
} from '#/lib/wedding/validation'
import { Route as AdminRoute } from './route'

export const Route = createFileRoute('/admin/settings')({
  beforeLoad: ({ context }) => {
    if (!context.session?.wedding) {
      throw redirect({ to: '/admin/onboarding' })
    }
  },
  component: AdminWeddingSettingsPage,
})

type FormState = {
  groom_name: string
  bride_name: string
  wedding_date: string
  status: WeddingStatus
  venue_name: string
  venue_location: string
  dress_code: string
  active_public_theme: PublicThemeId
}

function weddingToForm(wedding: Wedding): FormState {
  return {
    groom_name: wedding.groom_name,
    bride_name: wedding.bride_name,
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

  if (!session?.wedding) {
    return null
  }

  const [form, setForm] = useState<FormState>(() =>
    weddingToForm(session.wedding!),
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setField = <TKey extends keyof FormState>(
    key: TKey,
    value: FormState[TKey],
  ) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const wedding = await updateWedding({
        data: {
          groom_name: form.groom_name,
          bride_name: form.bride_name,
          wedding_date: form.wedding_date || null,
          status: form.status,
          venue_name: form.venue_name || null,
          venue_location: form.venue_location || null,
          dress_code: form.dress_code || null,
          active_public_theme: form.active_public_theme,
        },
      })
      setForm(weddingToForm(wedding))
      toast.success('Wedding settings saved.')
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to save wedding settings.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="admin-page-title">Wedding settings</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          Couple details, venue, dress code, public theme, and status. Edit page
          sections under Page content.
        </p>
      </div>

      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="bg-surface border-border space-y-4 rounded-xl border p-5">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Couple
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Field.Label>Groom</Field.Label>
              <Field.Control>
                <Input
                  value={form.groom_name}
                  onChange={(event) =>
                    setField('groom_name', event.target.value)
                  }
                  required
                />
              </Field.Control>
            </Field>
            <Field>
              <Field.Label>Bride</Field.Label>
              <Field.Control>
                <Input
                  value={form.bride_name}
                  onChange={(event) =>
                    setField('bride_name', event.target.value)
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
              <Select
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
              </Select>
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
              <Select
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
              </Select>
            </Field.Control>
            <Field.Description>
              {PUBLIC_THEME_META[form.active_public_theme].description} Visitors
              can still toggle light/dark.
            </Field.Description>
          </Field>
        </div>

        <Button type="submit" isLoading={isSubmitting}>
          Save settings
        </Button>
      </form>
    </div>
  )
}
