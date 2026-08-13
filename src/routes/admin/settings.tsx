import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AddressSearchField } from '#/components/address-search-field'
import { ThemePicker } from '#/components/admin/theme-picker'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { toast } from '#/components/ui/toaster'
import type { PublicThemeId } from '#/lib/site-settings'
import type { Wedding, WeddingStatus } from '#/lib/supabase/types'
import {
  checkPublicSlugAvailable,
  updateWedding,
} from '#/lib/wedding/settings'
import type { PublicSlugAvailability } from '#/lib/wedding/settings'
import { formatWeddingDate } from '#/lib/wedding/public-settings'
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
  public_slug: string
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
    public_slug: wedding.public_slug,
  }
}

function slugAvailabilityMessage(
  status: PublicSlugAvailability | null,
  checking: boolean,
): string | null {
  if (checking) return 'Checking availability…'
  if (!status) return null
  switch (status.status) {
    case 'available':
      return 'This public URL is available.'
    case 'current':
      return 'This is your current public URL.'
    case 'taken':
      return 'That public URL is already in use.'
    case 'invalid':
      return status.message
  }
}

function AdminWeddingSettingsPage() {
  const { session } = AdminRoute.useRouteContext()
  const router = useRouter()
  const wedding = session?.wedding ?? null
  const savedSlug = wedding ? wedding.public_slug.trim() : ''

  const [form, setForm] = useState<FormState | null>(() =>
    wedding ? weddingToForm(wedding) : null,
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [slugStatus, setSlugStatus] = useState<PublicSlugAvailability | null>(
    null,
  )
  const [slugChecking, setSlugChecking] = useState(false)

  useEffect(() => {
    if (!wedding) return
    setForm((current) => current ?? weddingToForm(wedding))
  }, [wedding])

  useEffect(() => {
    if (!form) return

    const slug = form.public_slug.trim() || savedSlug
    if (!slug) {
      setSlugStatus(null)
      setSlugChecking(false)
      return
    }

    setSlugChecking(true)
    const timer = window.setTimeout(() => {
      void checkPublicSlugAvailable({
        data: { slug, currentSlug: savedSlug },
      })
        .then((result) => {
          setSlugStatus(result)
        })
        .catch((err) => {
          setSlugStatus({
            status: 'invalid',
            message:
              err instanceof Error
                ? err.message
                : 'Unable to check public URL availability.',
          })
        })
        .finally(() => {
          setSlugChecking(false)
        })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [form?.public_slug, savedSlug])

  if (!wedding || !form) {
    return null
  }

  const setField = <TKey extends keyof FormState>(
    key: TKey,
    value: FormState[TKey],
  ) => {
    setForm((current) => (current ? { ...current, [key]: value } : current))
  }

  const slugMessage = slugAvailabilityMessage(slugStatus, slugChecking)
  const slugBlocksSave =
    slugChecking ||
    slugStatus?.status === 'taken' ||
    slugStatus?.status === 'invalid'

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const publicSlug = form.public_slug.trim() || savedSlug
    if (!publicSlug) {
      toast.error('Public URL slug is required.')
      return
    }
    if (slugBlocksSave) {
      toast.error(
        slugStatus?.status === 'taken'
          ? 'That public URL is already in use.'
          : slugStatus?.status === 'invalid'
            ? slugStatus.message
            : 'Choose an available public URL before saving.',
      )
      return
    }

    setIsSubmitting(true)

    try {
      const updated = await updateWedding({
        data: {
          groom_name: form.groom_name,
          bride_name: form.bride_name,
          wedding_date: form.wedding_date || null,
          status: form.status,
          venue_name: form.venue_name || null,
          venue_location: form.venue_location || null,
          dress_code: form.dress_code || null,
          active_public_theme: form.active_public_theme,
          public_slug: publicSlug,
        },
      })
      setForm(weddingToForm(updated))
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
          <Field
            invalid={
              slugStatus?.status === 'taken' || slugStatus?.status === 'invalid'
            }
          >
            <Field.Label>Public URL slug</Field.Label>
            <Field.Control>
              <Input
                value={form.public_slug}
                onChange={(event) =>
                  setField('public_slug', event.target.value)
                }
                onBlur={() => {
                  if (!form.public_slug.trim() && savedSlug) {
                    setField('public_slug', savedSlug)
                  }
                }}
                required
                placeholder={savedSlug || 'bride-groom-year'}
              />
            </Field.Control>
            {slugMessage ? (
              slugStatus?.status === 'taken' ||
              slugStatus?.status === 'invalid' ? (
                <Field.Error>{slugMessage}</Field.Error>
              ) : (
                <Field.Description>{slugMessage}</Field.Description>
              )
            ) : (
              <Field.Description>
                Guests open{' '}
                <span className="text-foreground font-medium">
                  /{form.public_slug.trim() || savedSlug || '…'}
                </span>
                . Created as bride-groom-year. Clear the field to keep the
                saved slug. Changing it breaks shared links.
              </Field.Description>
            )}
          </Field>
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
          <AddressSearchField
            value={form.venue_location}
            onChange={(next) => setField('venue_location', next)}
          />
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

        <div className="bg-surface border-border rounded-xl border p-5">
          <ThemePicker
            value={form.active_public_theme}
            onChange={(theme) => setField('active_public_theme', theme)}
            groomName={form.groom_name || 'Groom'}
            brideName={form.bride_name || 'Bride'}
            weddingDateLabel={formatWeddingDate(form.wedding_date || null)}
          />
        </div>

        <Button
          type="submit"
          size="md"
          isLoading={isSubmitting}
          disabled={slugBlocksSave}
        >
          Save settings
        </Button>
      </form>
    </div>
  )
}
