import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
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
          await updateGuest({
            data: { guestId: selectedGuest.id, ...payload },
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
    setDrawerOpen(true)
  }

  const openEdit = (guest: Guest) => {
    setIsCreating(false)
    setSelectedId(guest.id)
    form.reset(toGuestFormValues(guest))
    setDrawerOpen(true)
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
          <div data-row-stop className="flex justify-end">
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
        meta: { minWidth: 96, className: 'w-28' },
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Guests</h1>
          <p className="text-foreground-secondary mt-2 text-sm">
            Build your guest list here. RSVP tracking comes in the next phase.
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
          </p>
          <Field className="w-full max-w-xs">
            <Field.Label>Search</Field.Label>
            <Field.Control>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, party…"
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
          <Button type="submit" form="guest-form" isLoading={isSaving}>
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
