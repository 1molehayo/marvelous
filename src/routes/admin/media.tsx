import {
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { CopySimple, Trash, UploadSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '#/components/ui/button'
import { ConfirmDialog } from '#/components/ui/confirm-dialog'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { SideDrawer } from '#/components/ui/side-drawer'
import { toast } from '#/components/ui/toaster'
import {
  deleteMediaAsset,
  listMediaAssets,
  uploadMediaAsset,
} from '#/lib/media/media'
import {
  createPhotoShareGroup,
  deletePhotoShareGroup,
  listPhotoShareGroups,
  updatePhotoShareGroup,
} from '#/lib/photo-shares/photo-shares'
import type {
  PhotoShareGroupListItem,
  PhotoShareGuestOption,
} from '#/lib/photo-shares/photo-shares'
import { cn } from '#/lib/utils'
import { guestFullName } from '#/lib/guests/schema'

export const Route = createFileRoute('/admin/media')({
  beforeLoad: ({ context }) => {
    if (!context.session?.wedding) {
      throw redirect({ to: '/admin/onboarding' })
    }
  },
  loader: async () => {
    const [assets, shares] = await Promise.all([
      listMediaAssets(),
      listPhotoShareGroups(),
    ])
    return { assets, ...shares }
  },
  component: AdminMediaPage,
})

type TabId = 'library' | 'shares'

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function qrImageUrl(value: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`
}

function AdminMediaPage() {
  const initial = Route.useLoaderData()
  const router = useRouter()
  const [tab, setTab] = useState<TabId>('library')
  const [assets, setAssets] = useState(initial.assets)
  const [groups, setGroups] = useState(initial.groups)
  const [guests, setGuests] = useState(initial.guests)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null)
  const [isDeletingAsset, setIsDeletingAsset] = useState(false)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<PhotoShareGroupListItem | null>(null)
  const [shareName, setShareName] = useState('')
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([])
  const [isSavingShare, setIsSavingShare] = useState(false)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)

  useEffect(() => {
    setAssets(initial.assets)
    setGroups(initial.groups)
    setGuests(initial.guests)
  }, [initial])

  const openCreateShare = () => {
    setEditing(null)
    setShareName('')
    setSelectedAssetIds([])
    setSelectedGuestIds([])
    setDrawerOpen(true)
  }

  const openEditShare = (group: PhotoShareGroupListItem) => {
    setEditing(group)
    setShareName(group.name)
    setSelectedAssetIds(group.assetIds)
    setSelectedGuestIds(group.guestIds)
    setDrawerOpen(true)
  }

  const toggleId = (
    id: string,
    list: string[],
    setList: (next: string[]) => void,
  ) => {
    setList(
      list.includes(id) ? list.filter((item) => item !== id) : [...list, id],
    )
  }

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied.`)
    } catch {
      toast.error('Unable to copy to clipboard.')
    }
  }

  const refresh = async () => {
    await router.invalidate()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Media</h1>
          <p className="text-foreground-secondary mt-2 text-sm">
            Library photos and private guest shares. Shares never appear on the
            public wedding site.
          </p>
        </div>
        {tab === 'library' ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              tabIndex={-1}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setIsUploading(true)
                try {
                  const dataBase64 = await fileToBase64(file)
                  const uploaded = await uploadMediaAsset({
                    data: {
                      name: file.name,
                      type: file.type,
                      dataBase64,
                    },
                  })
                  setAssets((current) => [uploaded, ...current])
                  toast.success('Photo uploaded.')
                  await refresh()
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : 'Unable to upload photo.',
                  )
                } finally {
                  setIsUploading(false)
                  event.target.value = ''
                }
              }}
            />
            <Button
              type="button"
              size="md"
              isLoading={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadSimple />
              Upload photo
            </Button>
          </>
        ) : (
          <Button type="button" size="md" onClick={openCreateShare}>
            New share
          </Button>
        )}
      </div>

      <div className="border-border flex gap-2 border-b">
        {(
          [
            ['library', 'Library'],
            ['shares', 'Shares'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'px-3 py-2 text-sm tracking-wide uppercase transition',
              tab === id
                ? 'border-accent text-foreground border-b-2'
                : 'text-foreground-secondary hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'library' ? (
        assets.length === 0 ? (
          <p className="text-foreground-secondary text-sm">
            No photos yet. Upload images to use in private guest shares.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <figure
                key={asset.id}
                className="border-border bg-surface overflow-hidden rounded-xl border"
              >
                <div className="bg-background-secondary aspect-[4/3]">
                  {asset.signedUrl ? (
                    <img
                      src={asset.signedUrl}
                      alt={asset.filename}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-foreground-secondary flex h-full items-center justify-center text-xs uppercase tracking-wider">
                      Preview unavailable
                    </div>
                  )}
                </div>
                <figcaption className="space-y-2 p-3">
                  <p className="truncate text-sm font-medium">{asset.filename}</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void copyText(asset.storage_path, 'Storage path')
                      }
                    >
                      <CopySimple />
                      Path
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteAssetId(asset.id)}
                    >
                      <Trash />
                      Delete
                    </Button>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )
      ) : groups.length === 0 ? (
        <p className="text-foreground-secondary text-sm">
          No private shares yet. Create a share, pick photos and guests, then
          send the link or QR.
        </p>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-foreground-secondary mt-1 text-xs">
                  {group.assetIds.length} photo
                  {group.assetIds.length === 1 ? '' : 's'} ·{' '}
                  {group.guestIds.length} guest
                  {group.guestIds.length === 1 ? '' : 's'} · {group.openCount}{' '}
                  open
                  {group.openCount === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyText(group.groupUrl, 'Share link')}
                >
                  <CopySimple />
                  Copy link
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEditShare(group)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setDeleteGroupId(group.id)}
                >
                  <Trash />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SideDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SideDrawer.Header
          title={editing ? 'Edit photo share' : 'New photo share'}
          drawerDescription="Select photos and guests. Each guest can only be in one share group."
        />
        <SideDrawer.Content>
          <form
            id="photo-share-form"
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault()
              setIsSavingShare(true)
              try {
                if (editing) {
                  await updatePhotoShareGroup({
                    data: {
                      groupId: editing.id,
                      name: shareName,
                      assetIds: selectedAssetIds,
                      guestIds: selectedGuestIds,
                    },
                  })
                  toast.success('Share updated.')
                } else {
                  await createPhotoShareGroup({
                    data: {
                      name: shareName,
                      assetIds: selectedAssetIds,
                      guestIds: selectedGuestIds,
                    },
                  })
                  toast.success('Share created.')
                }
                setDrawerOpen(false)
                await refresh()
              } catch (err) {
                toast.error(
                  err instanceof Error ? err.message : 'Unable to save share.',
                )
              } finally {
                setIsSavingShare(false)
              }
            }}
          >
            <Field>
              <Field.Label>Name</Field.Label>
              <Field.Control>
                <Input
                  value={shareName}
                  onChange={(event) => setShareName(event.target.value)}
                  required
                  placeholder="Family album"
                />
              </Field.Control>
            </Field>

            <div className="space-y-2">
              <p className="text-sm font-medium">Photos</p>
              {assets.length === 0 ? (
                <p className="text-foreground-secondary text-sm">
                  Upload photos in the Library tab first.
                </p>
              ) : (
                <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto">
                  {assets.map((asset) => {
                    const selected = selectedAssetIds.includes(asset.id)
                    return (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() =>
                          toggleId(
                            asset.id,
                            selectedAssetIds,
                            setSelectedAssetIds,
                          )
                        }
                        className={cn(
                          'border-border aspect-square overflow-hidden rounded-lg border',
                          selected && 'ring-accent ring-2',
                        )}
                      >
                        {asset.signedUrl ? (
                          <img
                            src={asset.signedUrl}
                            alt={asset.filename}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Guests</p>
              <div className="max-h-56 space-y-1 overflow-y-auto">
                {guests.map((guest) => {
                  const blocked =
                    Boolean(guest.assignedGroupId) &&
                    guest.assignedGroupId !== editing?.id
                  const selected = selectedGuestIds.includes(guest.id)
                  return (
                    <label
                      key={guest.id}
                      className={cn(
                        'border-border flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                        blocked && 'opacity-50',
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={blocked}
                        checked={selected}
                        onChange={() =>
                          toggleId(
                            guest.id,
                            selectedGuestIds,
                            setSelectedGuestIds,
                          )
                        }
                      />
                      <span>
                        {guestFullName(guest)}
                        {blocked ? ' · in another share' : ''}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>

            {editing ? (
              <div className="border-border space-y-3 rounded-xl border p-3">
                <p className="text-sm font-medium">Share link & QR</p>
                <p className="text-foreground-secondary break-all text-xs">
                  {editing.groupUrl}
                </p>
                <img
                  src={qrImageUrl(editing.groupUrl)}
                  alt="QR code for share link"
                  className="border-border mx-auto rounded-lg border bg-white p-2"
                  width={180}
                  height={180}
                />
                <GuestLinks
                  group={editing}
                  guests={guests}
                  onCopy={copyText}
                />
              </div>
            ) : null}
          </form>
        </SideDrawer.Content>
        <SideDrawer.Footer>
          <Button
            type="button"
            variant="outline"
            onClick={() => setDrawerOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="photo-share-form"
            isLoading={isSavingShare}
          >
            {editing ? 'Save share' : 'Create share'}
          </Button>
        </SideDrawer.Footer>
      </SideDrawer>

      <ConfirmDialog
        open={Boolean(deleteAssetId)}
        onOpenChange={(open) => {
          if (!open) setDeleteAssetId(null)
        }}
        title="Delete photo?"
        description="This removes the photo from the library and any shares that use it."
        confirmLabel="Delete"
        tone="destructive"
        isConfirming={isDeletingAsset}
        onConfirm={() => {
          if (!deleteAssetId) return
          void (async () => {
            setIsDeletingAsset(true)
            try {
              await deleteMediaAsset({ data: { assetId: deleteAssetId } })
              toast.success('Photo deleted.')
              setDeleteAssetId(null)
              await refresh()
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Unable to delete photo.',
              )
            } finally {
              setIsDeletingAsset(false)
            }
          })()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteGroupId)}
        onOpenChange={(open) => {
          if (!open) setDeleteGroupId(null)
        }}
        title="Delete share?"
        description="Guests will no longer be able to open this private album."
        confirmLabel="Delete"
        tone="destructive"
        isConfirming={isDeletingGroup}
        onConfirm={() => {
          if (!deleteGroupId) return
          void (async () => {
            setIsDeletingGroup(true)
            try {
              await deletePhotoShareGroup({ data: { groupId: deleteGroupId } })
              toast.success('Share deleted.')
              setDeleteGroupId(null)
              await refresh()
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Unable to delete share.',
              )
            } finally {
              setIsDeletingGroup(false)
            }
          })()
        }}
      />
    </div>
  )
}

function GuestLinks({
  group,
  guests,
  onCopy,
}: {
  group: PhotoShareGroupListItem
  guests: PhotoShareGuestOption[]
  onCopy: (value: string, label: string) => Promise<void>
}) {
  const members = guests.filter((guest) => group.guestIds.includes(guest.id))
  if (members.length === 0) {
    return (
      <p className="text-foreground-secondary text-xs">
        Add guests to generate personal links (with open tracking).
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium tracking-wide uppercase">
        Personal guest links
      </p>
      {members.map((guest) => {
        const url = `${group.groupUrl}?g=${encodeURIComponent(guest.rsvp_token)}`
        return (
          <div
            key={guest.id}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="truncate">{guestFullName(guest)}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void onCopy(url, 'Guest link')}
            >
              <CopySimple />
              Copy
            </Button>
          </div>
        )
      })}
    </div>
  )
}
