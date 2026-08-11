import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { CopySimple, LinkSimple } from '@phosphor-icons/react'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { SideDrawer } from '#/components/ui/side-drawer'
import { TableView } from '#/components/ui/table-view'
import { Textarea } from '#/components/ui/textarea'
import { toast } from '#/components/ui/toaster'
import { fieldErrorMessage } from '#/lib/forms/field-error'
import { zodFormFieldErrors } from '#/lib/forms/zod-form-errors'
import {
  createGuest,
  deleteGuest,
  listGuests,
  updateGuest,
} from '#/lib/guests/guests'
import {
  guestFormSchema,
  guestFullName,
  toGuestFormValues,
} from '#/lib/guests/schema'
import type { GuestFormValues } from '#/lib/guests/schema'
import { updateGuestRsvp } from '#/lib/rsvp/rsvp'
import {
  RSVP_STATUS_LABELS,
  RSVP_STATUSES,
  adminRsvpFormSchema,
  maxAttendingForPlusOnes,
  rsvpStatusBadgeVariant,
  toAdminRsvpFormValues,
} from '#/lib/rsvp/schema'
import type { AdminRsvpFormValues } from '#/lib/rsvp/schema'
import type { Guest } from '#/lib/supabase/types'
import { internalError, raiseRouteError } from '#/lib/errors/route-error'

export const Route = createFileRoute('/admin/guests')({
  beforeLoad: ({ context }) => {
    if (!context.session?.wedding) {
      throw redirect({ to: '/admin/onboarding' })
    }
  },
  loader: async () => {
    try {
      return await listGuests()
    } catch (cause) {
      throw raiseRouteError(
        internalError({
          message: 'Failed to load guests for /admin/guests',
          cause,
        }),
        { source: 'server', pathname: '/admin/guests' },
      )
    }
  },
  component: AdminGuestsPage,
})

const emptyGuestForm: GuestFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  partyName: '',
  plusOnes: 0,
  notes: '',
}

const emptyRsvpForm: AdminRsvpFormValues = {
  status: 'pending',
  attendingCount: 0,
  dietaryNotes: '',
  message: '',
}

function guestRsvpPath(token: string) {
  return `/rsvp/${token}`
}

function AdminGuestsPage() {
  const initialGuests = Route.useLoaderData()
  const router = useRouter()
  const [guests, setGuests] = useState<Guest[]>(initialGuests)
  const [search, setSearch] = useState('')
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setGuests(initialGuests)
  }, [initialGuests])

  const selectedGuest = useMemo(
    () => guests.find((guest) => guest.id === selectedId) ?? null,
    [guests, selectedId],
  )

  const rsvpForm = useForm({
    defaultValues: emptyRsvpForm,
  })

  const form = useForm({
    defaultValues: emptyGuestForm,
    validators: {
      onSubmit: ({ value }) => {
        const parsed = guestFormSchema.safeParse(value)
        if (parsed.success) return undefined
        return zodFormFieldErrors(parsed.error)
      },
    },
    onSubmit: async ({ value }) => {
      const parsed = guestFormSchema.parse(value)
      setIsSaving(true)
      try {
        const payload = {
          first_name: parsed.firstName,
          last_name: parsed.lastName,
          email: parsed.email ?? '',
          phone: parsed.phone ?? '',
          party_name: parsed.partyName ?? '',
          plus_ones: parsed.plusOnes,
          notes: parsed.notes ?? '',
        }
        if (isCreating) {
          await createGuest({ data: payload })
          toast.success('Guest added.')
        } else if (selectedGuest) {
          const rsvpValues = rsvpForm.state.values
          const maxAttending = maxAttendingForPlusOnes(parsed.plusOnes)
          const rsvpNormalized = {
            ...rsvpValues,
            attendingCount:
              rsvpValues.status === 'attending'
                ? rsvpValues.attendingCount
                : 0,
          }
          const rsvpParsed = adminRsvpFormSchema.safeParse(rsvpNormalized)
          if (!rsvpParsed.success) {
            throw new Error(
              rsvpParsed.error.issues[0]?.message ?? 'Invalid RSVP details.',
            )
          }
          if (
            rsvpParsed.data.status === 'attending' &&
            rsvpParsed.data.attendingCount > maxAttending
          ) {
            throw new Error(
              `Attending count cannot exceed ${maxAttending} for this guest.`,
            )
          }

          await updateGuest({
            data: { guestId: selectedGuest.id, ...payload },
          })
          await updateGuestRsvp({
            data: {
              guestId: selectedGuest.id,
              status: rsvpParsed.data.status,
              attending_count: rsvpParsed.data.attendingCount,
              dietary_notes: rsvpParsed.data.dietaryNotes,
              rsvp_message: rsvpParsed.data.message,
            },
          })
          toast.success('Guest updated.')
        }
        setDrawerOpen(false)
        setSelectedId(null)
        setIsCreating(false)
        await router.invalidate()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Unable to save guest.',
        )
      } finally {
        setIsSaving(false)
      }
    },
  })

  const openCreate = () => {
    setIsCreating(true)
    setSelectedId(null)
    form.reset(emptyGuestForm)
    rsvpForm.reset(emptyRsvpForm)
    setDrawerOpen(true)
  }

  const openEdit = (guest: Guest) => {
    setIsCreating(false)
    setSelectedId(guest.id)
    form.reset(toGuestFormValues(guest))
    rsvpForm.reset(toAdminRsvpFormValues(guest))
    setDrawerOpen(true)
  }

  const copyRsvpLink = async (guest: Guest) => {
    const url = `${window.location.origin}${guestRsvpPath(guest.rsvp_token)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('RSVP link copied.')
    } catch {
      toast.error('Could not copy link.')
    }
  }

  const columns = useMemo<ColumnDef<Guest>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => guestFullName(row),
        header: 'Name',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">
              {guestFullName(row.original)}
            </p>
            {row.original.party_name ? (
              <p className="text-foreground-secondary truncate text-sm">
                {row.original.party_name}
              </p>
            ) : null}
          </div>
        ),
        meta: { minWidth: 180 },
      },
      {
        id: 'email',
        accessorFn: (row) => row.email ?? '',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-foreground-secondary text-sm">
            {row.original.email ?? '—'}
          </span>
        ),
        meta: { minWidth: 160 },
      },
      {
        id: 'rsvp',
        accessorFn: (row) => row.rsvp_status,
        header: 'RSVP',
        cell: ({ row }) => (
          <Badge
            variant={rsvpStatusBadgeVariant(row.original.rsvp_status)}
            size="sm"
          >
            {RSVP_STATUS_LABELS[row.original.rsvp_status]}
          </Badge>
        ),
        meta: { minWidth: 120 },
      },
      {
        id: 'plusOnes',
        accessorFn: (row) => row.plus_ones,
        header: 'Plus-ones',
        cell: ({ row }) => row.original.plus_ones,
        meta: { minWidth: 100 },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: '',
        cell: ({ row }) => (
          <div data-row-stop className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void copyRsvpLink(row.original)}
            >
              <LinkSimple />
              Link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => openEdit(row.original)}
            >
              View
            </Button>
          </div>
        ),
        meta: { minWidth: 180, className: 'w-44' },
      },
    ],
    [],
  )

  const table = useReactTable({
    data: guests,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()
      if (!query) return true
      const guest = row.original
      const haystack = [
        guestFullName(guest),
        guest.email ?? '',
        guest.phone ?? '',
        guest.party_name ?? '',
        guest.notes ?? '',
        RSVP_STATUS_LABELS[guest.rsvp_status],
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    },
  })

  const onDelete = async () => {
    if (!selectedGuest) return
    setIsDeleting(true)
    try {
      await deleteGuest({ data: { guestId: selectedGuest.id } })
      toast.success('Guest removed.')
      setDeleteOpen(false)
      setDrawerOpen(false)
      setSelectedId(null)
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to remove guest.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const attendingSummary = guests.reduce(
    (sum, guest) =>
      guest.rsvp_status === 'attending' ? sum + (guest.attending_count ?? 0) : sum,
    0,
  )
  const pendingCount = guests.filter((g) => g.rsvp_status === 'pending').length

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Guests</h1>
          <p className="text-foreground-secondary mt-2 text-sm">
            Manage the guest list and RSVP responses. Share each guest’s private
            link until email invites ship.
          </p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          Add guest
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            {guests.length} guest{guests.length === 1 ? '' : 's'}
            {' · '}
            {attendingSummary} attending
            {' · '}
            {pendingCount} pending
          </p>
          <Field className="w-full max-w-xs">
            <Field.Label>Search</Field.Label>
            <Field.Control>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, RSVP…"
              />
            </Field.Control>
          </Field>
        </div>

        <TableView
          table={table}
          emptyMessage="No guests yet. Add your first guest to get started."
          onRowClick={openEdit}
        />
      </div>

      <SideDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) {
            setSelectedId(null)
            setIsCreating(false)
          }
        }}
      >
        <SideDrawer.Header
          title={isCreating ? 'Add guest' : guestFullName(selectedGuest ?? {
            first_name: 'Guest',
            last_name: '',
          })}
          drawerDescription="Guest details"
        />
        <SideDrawer.Content>
          <form
            id="guest-form"
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              event.stopPropagation()
              void form.handleSubmit()
            }}
          >
            <form.Subscribe selector={(state) => state.submissionAttempts > 0}>
              {(submitted) => (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.Field name="firstName">
                      {(field) => {
                        const error = fieldErrorMessage(field.state.meta.errors)
                        const invalid =
                          !!error && (field.state.meta.isTouched || submitted)
                        return (
                          <Field invalid={invalid}>
                            <Field.Label required>First name</Field.Label>
                            <Field.Control>
                              <Input
                                value={field.state.value}
                                invalid={invalid}
                                onBlur={field.handleBlur}
                                onChange={(event) =>
                                  field.handleChange(event.target.value)
                                }
                              />
                            </Field.Control>
                            {invalid ? <Field.Error>{error}</Field.Error> : null}
                          </Field>
                        )
                      }}
                    </form.Field>
                    <form.Field name="lastName">
                      {(field) => {
                        const error = fieldErrorMessage(field.state.meta.errors)
                        const invalid =
                          !!error && (field.state.meta.isTouched || submitted)
                        return (
                          <Field invalid={invalid}>
                            <Field.Label required>Last name</Field.Label>
                            <Field.Control>
                              <Input
                                value={field.state.value}
                                invalid={invalid}
                                onBlur={field.handleBlur}
                                onChange={(event) =>
                                  field.handleChange(event.target.value)
                                }
                              />
                            </Field.Control>
                            {invalid ? <Field.Error>{error}</Field.Error> : null}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  <form.Field name="email">
                    {(field) => {
                      const error = fieldErrorMessage(field.state.meta.errors)
                      const invalid =
                        !!error && (field.state.meta.isTouched || submitted)
                      return (
                        <Field invalid={invalid}>
                          <Field.Label>Email</Field.Label>
                          <Field.Control>
                            <Input
                              type="email"
                              value={field.state.value ?? ''}
                              invalid={invalid}
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(event.target.value)
                              }
                            />
                          </Field.Control>
                          {invalid ? <Field.Error>{error}</Field.Error> : null}
                        </Field>
                      )
                    }}
                  </form.Field>

                  <form.Field name="phone">
                    {(field) => (
                      <Field>
                        <Field.Label>Phone</Field.Label>
                        <Field.Control>
                          <Input
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                        </Field.Control>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="partyName">
                    {(field) => (
                      <Field>
                        <Field.Label>Party / household</Field.Label>
                        <Field.Control>
                          <Input
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            placeholder="Optional group label"
                          />
                        </Field.Control>
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name="plusOnes">
                    {(field) => {
                      const error = fieldErrorMessage(field.state.meta.errors)
                      const invalid =
                        !!error && (field.state.meta.isTouched || submitted)
                      return (
                        <Field invalid={invalid}>
                          <Field.Label>Plus-ones</Field.Label>
                          <Field.Control>
                            <Input
                              type="number"
                              min={0}
                              max={20}
                              value={String(field.state.value)}
                              invalid={invalid}
                              onBlur={field.handleBlur}
                              onChange={(event) =>
                                field.handleChange(
                                  Number(event.target.value || 0),
                                )
                              }
                            />
                          </Field.Control>
                          {invalid ? <Field.Error>{error}</Field.Error> : null}
                        </Field>
                      )
                    }}
                  </form.Field>

                  <form.Field name="notes">
                    {(field) => (
                      <Field>
                        <Field.Label>Notes</Field.Label>
                        <Field.Control>
                          <Textarea
                            rows={4}
                            value={field.state.value ?? ''}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                          />
                        </Field.Control>
                      </Field>
                    )}
                  </form.Field>
                </>
              )}
            </form.Subscribe>

            {!isCreating && selectedGuest ? (
              <div className="border-border space-y-4 border-t pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
                    RSVP
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void copyRsvpLink(selectedGuest)}
                  >
                    <CopySimple />
                    Copy link
                  </Button>
                </div>

                <rsvpForm.Field name="status">
                  {(field) => (
                    <Field>
                      <Field.Label>Status</Field.Label>
                      <Field.Control>
                        <Select
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            const next = event.target
                              .value as AdminRsvpFormValues['status']
                            field.handleChange(next)
                            if (next !== 'attending') {
                              rsvpForm.setFieldValue('attendingCount', 0)
                            } else if (
                              rsvpForm.getFieldValue('attendingCount') < 1
                            ) {
                              rsvpForm.setFieldValue('attendingCount', 1)
                            }
                          }}
                        >
                          {RSVP_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {RSVP_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </Select>
                      </Field.Control>
                    </Field>
                  )}
                </rsvpForm.Field>

                <rsvpForm.Subscribe selector={(state) => state.values.status}>
                  {(status) =>
                    status === 'attending' ? (
                      <rsvpForm.Field name="attendingCount">
                        {(field) => (
                          <Field>
                            <Field.Label>Number attending</Field.Label>
                            <Field.Control>
                              <Input
                                type="number"
                                min={1}
                                max={maxAttendingForPlusOnes(
                                  selectedGuest?.plus_ones ?? 0,
                                )}
                                value={String(field.state.value)}
                                onBlur={field.handleBlur}
                                onChange={(event) =>
                                  field.handleChange(
                                    Number(event.target.value || 0),
                                  )
                                }
                              />
                            </Field.Control>
                          </Field>
                        )}
                      </rsvpForm.Field>
                    ) : null
                  }
                </rsvpForm.Subscribe>

                <rsvpForm.Field name="dietaryNotes">
                  {(field) => (
                    <Field>
                      <Field.Label>Dietary notes</Field.Label>
                      <Field.Control>
                        <Textarea
                          rows={3}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </Field.Control>
                    </Field>
                  )}
                </rsvpForm.Field>

                <rsvpForm.Field name="message">
                  {(field) => (
                    <Field>
                      <Field.Label>Guest message</Field.Label>
                      <Field.Control>
                        <Textarea
                          rows={3}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                      </Field.Control>
                    </Field>
                  )}
                </rsvpForm.Field>
              </div>
            ) : null}
          </form>
        </SideDrawer.Content>
        <SideDrawer.Footer className="justify-between">
          {!isCreating && selectedGuest ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Remove
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" form="guest-form" size="md" isLoading={isSaving}>
            {isCreating ? 'Add guest' : 'Save changes'}
          </Button>
        </SideDrawer.Footer>
      </SideDrawer>

      <ConfirmDialog
        open={deleteOpen}
        title="Remove this guest?"
        description="They will be removed from the guest list. This cannot be undone."
        confirmLabel="Remove"
        tone="destructive"
        isConfirming={isDeleting}
        onOpenChange={setDeleteOpen}
        onConfirm={onDelete}
      />
    </div>
  )
}
