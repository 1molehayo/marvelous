import { createFileRoute, useRouter } from '@tanstack/react-router'
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { SideDrawer } from '#/components/ui/side-drawer'
import { TableView } from '#/components/ui/table-view'
import { toast } from '#/components/ui/toaster'
import { inviteAdmin, listAdmins, removeAdmin } from '#/lib/auth/admins'
import type { AdminListItem } from '#/lib/auth/admins'
import { requireSuperAdmin } from '#/lib/auth/require-access'
import { ADMIN_STATUS_LABELS, adminFullName } from '#/lib/auth/types'
import type { AdminAccountStatus } from '#/lib/auth/types'
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

function statusBadgeVariant(
  status: AdminAccountStatus,
): 'success' | 'warning' | 'neutral' {
  switch (status) {
    case 'active':
      return 'success'
    case 'deletion_requested':
      return 'warning'
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
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    setAdmins(initialAdmins)
  }, [initialAdmins])

  const selectedAdmin = useMemo(
    () => admins.find((admin) => admin.id === selectedId) ?? null,
    [admins, selectedId],
  )

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
          <div data-row-stop className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedId(row.original.id)
                setDrawerOpen(true)
              }}
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
    data: admins,
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

  const onRemove = async () => {
    if (!selectedAdmin) return
    setIsRemoving(true)
    try {
      await removeAdmin({ data: { adminId: selectedAdmin.id } })
      toast.success('Admin removed.')
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="admin-page-title">Admins</h1>
        <p className="text-foreground-secondary mt-2 text-sm">
          Invite admins, track invite status, and review deletion requests.
          Remove an admin from their detail drawer.
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
                autoComplete="off"
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
                autoComplete="off"
              />
            </Field.Control>
          </Field>
        </div>
        <Field>
          <Field.Label required>Email</Field.Label>
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

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-foreground-secondary text-xs tracking-[0.16em] uppercase">
            Current admins
          </p>
          <Field className="w-full max-w-xs">
            <Field.Label>Search</Field.Label>
            <Field.Control>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, status…"
              />
            </Field.Control>
          </Field>
        </div>

        <TableView
          table={table}
          emptyMessage="No admins match your search."
          onRowClick={(admin) => {
            setSelectedId(admin.id)
            setDrawerOpen(true)
          }}
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

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-foreground-secondary">Email</dt>
                  <dd className="mt-1 font-medium break-all">
                    {selectedAdmin.email ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-foreground-secondary">Created</dt>
                  <dd className="mt-1 font-medium">
                    {formatDateTime(selectedAdmin.created_at)}
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
            {selectedAdmin.role === 'admin' ? (
              <SideDrawer.Footer>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setRemoveOpen(true)}
                >
                  Remove admin
                </Button>
              </SideDrawer.Footer>
            ) : null}
          </>
        ) : null}
      </SideDrawer>

      <ConfirmDialog
        open={removeOpen}
        title="Remove this admin?"
        description="They will lose access immediately. This cannot be undone."
        confirmLabel="Remove"
        tone="destructive"
        isConfirming={isRemoving}
        onOpenChange={setRemoveOpen}
        onConfirm={onRemove}
      />
    </div>
  )
}
