import {
  createFileRoute,
  isNotFound,
  isRedirect,
  redirect,
  useRouter,
} from '@tanstack/react-router'
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
import { DropdownMenu } from '#/components/ui/dropdown-menu'
import type { DropdownMenuItem } from '#/components/ui/dropdown-menu'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { SideDrawer } from '#/components/ui/side-drawer'
import { Spinner } from '#/components/ui/spinner'
import { TableView } from '#/components/ui/table-view'
import { toast } from '#/components/ui/toaster'
import {
  cancelAdminInvite,
  inviteAdmin,
  listAdmins,
  reinviteAdmin,
  removeAdmin,
  resendAdminInvite,
  updateAdminNames,
} from '#/lib/auth/admins'
import type { AdminListItem } from '#/lib/auth/admins'
import { isSuperAdminProfile } from '#/lib/auth/roles'
import {
  ADMIN_STATUS_LABELS,
  DEFAULT_VISIBLE_ADMIN_STATUSES,
  adminFullName,
} from '#/lib/auth/types'
import type { AdminAccountStatus } from '#/lib/auth/types'
import { internalError, raiseRouteError } from '#/lib/errors/route-error'

function isAbortError(cause: unknown) {
  if (!cause || typeof cause !== 'object') return false
  const name = 'name' in cause ? String(cause.name) : ''
  return name === 'AbortError'
}

export const Route = createFileRoute('/admin/admins')({
  beforeLoad: ({ context }) => {
    // Soft gate — redirect instead of RouteError so a preload race never
    // flashes the full-page “Something went wrong” UI.
    if (!context.session || !isSuperAdminProfile(context.session.profile)) {
      throw redirect({ to: '/admin' })
    }
  },
  pendingComponent: AdminAdminsPending,
  loader: async () => {
    try {
      return await listAdmins()
    } catch (cause) {
      if (isRedirect(cause) || isNotFound(cause) || isAbortError(cause)) {
        throw cause
      }
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

function AdminAdminsPending() {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}

function statusBadgeVariant(
  status: AdminAccountStatus,
): 'success' | 'warning' | 'neutral' | 'error' {
  switch (status) {
    case 'active':
      return 'success'
    case 'deletion_requested':
      return 'warning'
    case 'cancelled':
      return 'error'
    case 'pending':
      return 'neutral'
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function AdminAdminsPage() {
  const initialAdmins = Route.useLoaderData()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminListItem[]>(initialAdmins)
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [search, setSearch] = useState('')
  const [showAllStatuses, setShowAllStatuses] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [isSavingNames, setIsSavingNames] = useState(false)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  useEffect(() => {
    setAdmins(initialAdmins)
  }, [initialAdmins])

  const selectedAdmin = useMemo(
    () => admins.find((admin) => admin.id === selectedId) ?? null,
    [admins, selectedId],
  )

  useEffect(() => {
    if (!selectedAdmin) return
    setEditFirstName(selectedAdmin.first_name ?? '')
    setEditLastName(selectedAdmin.last_name ?? '')
  }, [selectedAdmin])

  const visibleAdmins = useMemo(() => {
    if (showAllStatuses) return admins
    return admins.filter((admin) =>
      DEFAULT_VISIBLE_ADMIN_STATUSES.includes(admin.status),
    )
  }, [admins, showAllStatuses])

  const openDrawer = (admin: AdminListItem) => {
    setSelectedId(admin.id)
    setDrawerOpen(true)
  }

  const runAction = async (
    adminId: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    setActionBusyId(adminId)
    try {
      await action()
      toast.success(successMessage)
      await router.invalidate()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setActionBusyId(null)
    }
  }

  const menuItemsFor = (admin: AdminListItem): DropdownMenuItem[] => {
    const items: DropdownMenuItem[] = [
      {
        id: 'view',
        label: 'View',
        onSelect: () => openDrawer(admin),
      },
    ]

    if (admin.role === 'super_admin') {
      return items
    }

    if (admin.status === 'pending') {
      items.push(
        {
          id: 'resend',
          label: 'Resend invite',
          disabled: actionBusyId === admin.id,
          onSelect: () =>
            void runAction(
              admin.id,
              () => resendAdminInvite({ data: { adminId: admin.id } }),
              'Invite resent.',
            ),
        },
        {
          id: 'cancel',
          label: 'Cancel invite',
          tone: 'destructive',
          disabled: actionBusyId === admin.id,
          onSelect: () =>
            void runAction(
              admin.id,
              () => cancelAdminInvite({ data: { adminId: admin.id } }),
              'Invite cancelled.',
            ),
        },
      )
    }

    if (admin.status === 'cancelled') {
      items.push({
        id: 'reinvite',
        label: 'Send new invitation',
        disabled: actionBusyId === admin.id,
        onSelect: () =>
          void runAction(
            admin.id,
            () => reinviteAdmin({ data: { adminId: admin.id } }),
            'Invitation sent.',
          ),
      })
    }

    if (admin.status === 'active' || admin.status === 'deletion_requested') {
      items.push(
        {
          id: 'edit',
          label: 'Edit details',
          onSelect: () => openDrawer(admin),
        },
        {
          id: 'delete',
          label: 'Delete admin',
          tone: 'destructive',
          onSelect: () => {
            setSelectedId(admin.id)
            setRemoveOpen(true)
          },
        },
      )
    }

    return items
  }

  const columns = useMemo<ColumnDef<AdminListItem>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => adminFullName(row),
        header: 'Name',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{adminFullName(row.original)}</p>
            <p className="text-foreground-secondary truncate text-sm">
              {row.original.email ?? row.original.id}
            </p>
          </div>
        ),
        meta: { minWidth: 200 },
      },
      {
        id: 'status',
        accessorFn: (row) => row.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={statusBadgeVariant(row.original.status)} size="sm">
            {ADMIN_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
        meta: { minWidth: 140 },
      },
      {
        id: 'role',
        accessorFn: (row) => row.role,
        header: 'Role',
        cell: ({ row }) =>
          row.original.role === 'super_admin' ? (
            <Badge variant="info" size="sm">
              Super admin
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Admin
            </Badge>
          ),
        meta: { minWidth: 120 },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu items={menuItemsFor(row.original)} />
          </div>
        ),
        meta: { minWidth: 64, className: 'w-16' },
      },
    ],
    [actionBusyId, admins],
  )

  const table = useReactTable({
    data: visibleAdmins,
    columns,
    state: {
      sorting,
      globalFilter: search,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()
      if (!query) return true
      const admin = row.original
      const haystack = [
        adminFullName(admin),
        admin.email ?? '',
        ADMIN_STATUS_LABELS[admin.status],
        admin.role === 'super_admin' ? 'super admin' : 'admin',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    },
  })

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
      toast.success('Invite sent. They’ll get an email with an accept link.')
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to invite admin.',
      )
    } finally {
      setIsInviting(false)
    }
  }

  const onSaveNames = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAdmin) return
    setIsSavingNames(true)
    try {
      await updateAdminNames({
        data: {
          adminId: selectedAdmin.id,
          first_name: editFirstName,
          last_name: editLastName,
        },
      })
      toast.success('Admin details updated.')
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to update admin.',
      )
    } finally {
      setIsSavingNames(false)
    }
  }

  const onRemove = async () => {
    if (!selectedAdmin) return
    setIsRemoving(true)
    try {
      await removeAdmin({ data: { adminId: selectedAdmin.id } })
      toast.success('Admin archived and removed.')
      setRemoveOpen(false)
      setDrawerOpen(false)
      setSelectedId(null)
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to remove admin.',
      )
    } finally {
      setIsRemoving(false)
    }
  }

  const canEditNames =
    selectedAdmin &&
    selectedAdmin.role === 'admin' &&
    (selectedAdmin.status === 'active' ||
      selectedAdmin.status === 'deletion_requested' ||
      selectedAdmin.status === 'pending')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="admin-page-title">Admins</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          Invite admins, resend or cancel pending invites, and review deletion
          requests. Deleted admins are archived so the email can be invited
          again.
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
            <Field.Label required>First name</Field.Label>
            <Field.Control>
              <Input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                required
              />
            </Field.Control>
          </Field>
          <Field>
            <Field.Label required>Last name</Field.Label>
            <Field.Control>
              <Input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
              />
            </Field.Control>
          </Field>
        </div>
        <Field>
          <Field.Label required>Email</Field.Label>
          <Field.Control>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field.Control>
        </Field>
        <Button type="submit" size="md" isLoading={isInviting}>
          Invite admin
        </Button>
      </form>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-2">
            <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
              Current admins
            </p>
            <label className="text-foreground-secondary flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showAllStatuses}
                onChange={(event) => setShowAllStatuses(event.target.checked)}
                className="accent-accent size-4"
              />
              Show all statuses (including cancelled)
            </label>
          </div>
          <Field className="w-full max-w-xs">
            <Field.Label>Search</Field.Label>
            <Field.Control>
              <Input
                size="sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, status…"
              />
            </Field.Control>
          </Field>
        </div>

        <TableView
          table={table}
          emptyMessage="No admins match your filters."
          onRowClick={openDrawer}
        />
      </div>

      <SideDrawer
        open={drawerOpen && !!selectedAdmin}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setSelectedId(null)
        }}
      >
        {selectedAdmin ? (
          <>
            <SideDrawer.Header
              title={adminFullName(selectedAdmin)}
              drawerDescription="Admin account details"
            />
            <SideDrawer.Content className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusBadgeVariant(selectedAdmin.status)}>
                  {ADMIN_STATUS_LABELS[selectedAdmin.status]}
                </Badge>
                {selectedAdmin.role === 'super_admin' ? (
                  <Badge variant="info">Super admin</Badge>
                ) : (
                  <Badge variant="neutral">Admin</Badge>
                )}
              </div>

              {canEditNames ? (
                <form className="space-y-3" onSubmit={onSaveNames}>
                  <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
                    Edit details
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field>
                      <Field.Label required>First name</Field.Label>
                      <Field.Control>
                        <Input
                          value={editFirstName}
                          onChange={(event) =>
                            setEditFirstName(event.target.value)
                          }
                          required
                        />
                      </Field.Control>
                    </Field>
                    <Field>
                      <Field.Label required>Last name</Field.Label>
                      <Field.Control>
                        <Input
                          value={editLastName}
                          onChange={(event) =>
                            setEditLastName(event.target.value)
                          }
                          required
                        />
                      </Field.Control>
                    </Field>
                  </div>
                  <Field>
                    <Field.Label>Email</Field.Label>
                    <Field.Control>
                      <Input
                        value={selectedAdmin.email ?? ''}
                        disabled
                        readOnly
                      />
                    </Field.Control>
                    <Field.Description>
                      Admin email can’t be changed. Invite a new address
                      instead.
                    </Field.Description>
                  </Field>
                  <Button type="submit" size="md" isLoading={isSavingNames}>
                    Save name
                  </Button>
                </form>
              ) : (
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-foreground-secondary">Email</dt>
                    <dd className="mt-1 font-medium break-all">
                      {selectedAdmin.email ?? '—'}
                    </dd>
                  </div>
                </dl>
              )}

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-foreground-secondary">Created</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(selectedAdmin.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-secondary">Invited</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(selectedAdmin.invited_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-secondary">Accepted</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(selectedAdmin.invite_accepted_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-secondary">Last sign-in</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(selectedAdmin.last_sign_in_at)}
                  </dd>
                </div>
                {selectedAdmin.deletion_requested_at ? (
                  <>
                    <div>
                      <dt className="text-foreground-secondary">
                        Deletion requested
                      </dt>
                      <dd className="mt-1 font-medium">
                        {formatDateTime(selectedAdmin.deletion_requested_at)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-foreground-secondary">Reason</dt>
                      <dd className="mt-1 font-medium whitespace-pre-wrap">
                        {selectedAdmin.deletion_reason?.trim() || '—'}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </SideDrawer.Content>
            {selectedAdmin.role === 'admin' &&
            (selectedAdmin.status === 'active' ||
              selectedAdmin.status === 'deletion_requested') ? (
              <SideDrawer.Footer>
                <Button
                  type="button"
                  size="md"
                  variant="destructive"
                  onClick={() => setRemoveOpen(true)}
                >
                  Delete admin
                </Button>
              </SideDrawer.Footer>
            ) : null}
          </>
        ) : null}
      </SideDrawer>

      <ConfirmDialog
        open={removeOpen}
        title="Delete this admin?"
        description="They’ll lose access immediately. Their profile is archived so activity history can still resolve them later, and the email can be invited again."
        confirmLabel="Delete admin"
        tone="destructive"
        isConfirming={isRemoving}
        onOpenChange={setRemoveOpen}
        onConfirm={onRemove}
      />
    </div>
  )
}
