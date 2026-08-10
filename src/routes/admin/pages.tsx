import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import {
  CaretDown,
  CaretDoubleDown,
  CaretDoubleUp,
  CaretUp,
  Trash,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Field } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Select } from '#/components/ui/select'
import { Textarea } from '#/components/ui/textarea'
import { toast } from '#/components/ui/toaster'
import {
  getPageBlocks,
  getSignedPhotoUrl,
  updatePageBlocks,
  uploadPageBlockImage,
} from '#/lib/page-blocks/settings'
import {
  PAGE_BLOCK_TYPES,
  PAGE_BLOCK_TYPE_LABELS,
  createDefaultBlock,
} from '#/lib/page-blocks/types'
import type { PageBlock, PageBlockType } from '#/lib/page-blocks/types'

export const Route = createFileRoute('/admin/pages')({
  beforeLoad: ({ context }) => {
    if (!context.session?.wedding) {
      throw redirect({ to: '/admin/onboarding' })
    }
  },
  loader: () => getPageBlocks(),
  component: AdminPagesPage,
})

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function moveBlock(blocks: PageBlock[], from: number, to: number) {
  if (to < 0 || to >= blocks.length) return blocks
  const next = [...blocks]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function BlockEditor({
  block,
  onChange,
}: {
  block: PageBlock
  onChange: (block: PageBlock) => void
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadPreview = async () => {
      if (block.type !== 'image' || !block.fields.imagePath) {
        setPreviewUrl(null)
        return
      }
      try {
        const url = await getSignedPhotoUrl({
          data: { imagePath: block.fields.imagePath },
        })
        if (!cancelled) setPreviewUrl(url)
      } catch {
        if (!cancelled) setPreviewUrl(null)
      }
    }

    void loadPreview()
    return () => {
      cancelled = true
    }
  }, [block])

  if (block.type === 'hero') {
    return (
      <div className="space-y-4">
        <Field>
          <Field.Label>Title override</Field.Label>
          <Field.Control>
            <Input
              value={block.fields.title ?? ''}
              onChange={(event) =>
                onChange({
                  ...block,
                  fields: {
                    ...block.fields,
                    title: event.target.value || null,
                  },
                })
              }
              placeholder="Leave empty to use groom & bride names"
            />
          </Field.Control>
        </Field>
        <Field>
          <Field.Label>Tagline</Field.Label>
          <Field.Control>
            <Input
              value={block.fields.tagline ?? ''}
              onChange={(event) =>
                onChange({
                  ...block,
                  fields: {
                    ...block.fields,
                    tagline: event.target.value || null,
                  },
                })
              }
            />
          </Field.Control>
        </Field>
      </div>
    )
  }

  if (block.type === 'story') {
    return (
      <div className="space-y-4">
        <Field>
          <Field.Label>Title</Field.Label>
          <Field.Control>
            <Input
              value={block.fields.title}
              onChange={(event) =>
                onChange({
                  ...block,
                  fields: { ...block.fields, title: event.target.value },
                })
              }
            />
          </Field.Control>
        </Field>
        <Field>
          <Field.Label>Body</Field.Label>
          <Field.Control>
            <Textarea
              rows={5}
              value={block.fields.body}
              onChange={(event) =>
                onChange({
                  ...block,
                  fields: { ...block.fields, body: event.target.value },
                })
              }
            />
          </Field.Control>
        </Field>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div className="space-y-4">
        <Field>
          <Field.Label>Image</Field.Label>
          <Field.Control>
            <Input
              type="file"
              accept="image/*"
              disabled={isUploading}
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                setIsUploading(true)
                try {
                  const dataBase64 = await fileToBase64(file)
                  const uploaded = await uploadPageBlockImage({
                    data: {
                      name: file.name,
                      type: file.type,
                      dataBase64,
                    },
                  })
                  onChange({
                    ...block,
                    fields: {
                      ...block.fields,
                      imagePath: uploaded.path,
                    },
                  })
                  setPreviewUrl(uploaded.signedUrl)
                  toast.success('Image uploaded.')
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : 'Unable to upload image.',
                  )
                } finally {
                  setIsUploading(false)
                  event.target.value = ''
                }
              }}
            />
          </Field.Control>
          <Field.Description>
            Stored in the private photos bucket. Preview uses a signed URL.
          </Field.Description>
        </Field>
        {block.fields.imagePath ? (
          <p className="text-foreground-secondary text-xs break-all">
            Path: {block.fields.imagePath}
          </p>
        ) : null}
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={block.fields.title ?? 'Block preview'}
            className="border-border max-h-56 w-full rounded-lg border object-cover"
          />
        ) : null}
        <Field>
          <Field.Label>Title</Field.Label>
          <Field.Control>
            <Input
              value={block.fields.title ?? ''}
              onChange={(event) =>
                onChange({
                  ...block,
                  fields: {
                    ...block.fields,
                    title: event.target.value || null,
                  },
                })
              }
            />
          </Field.Control>
        </Field>
        <Field>
          <Field.Label>Description</Field.Label>
          <Field.Control>
            <Textarea
              rows={3}
              value={block.fields.description ?? ''}
              onChange={(event) =>
                onChange({
                  ...block,
                  fields: {
                    ...block.fields,
                    description: event.target.value || null,
                  },
                })
              }
            />
          </Field.Control>
        </Field>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={block.fields.showVenue}
          onChange={(event) =>
            onChange({
              ...block,
              fields: {
                ...block.fields,
                showVenue: event.target.checked,
              },
            })
          }
        />
        Show venue from wedding settings
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={block.fields.showDressCode}
          onChange={(event) =>
            onChange({
              ...block,
              fields: {
                ...block.fields,
                showDressCode: event.target.checked,
              },
            })
          }
        />
        Show dress code from wedding settings
      </label>
    </div>
  )
}

function AdminPagesPage() {
  const initialBlocks = Route.useLoaderData()
  const router = useRouter()
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks)
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(initialBlocks.map((block) => block.id)),
  )
  const [addType, setAddType] = useState<PageBlockType>('story')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setBlocks(initialBlocks)
    setOpenIds(new Set(initialBlocks.map((block) => block.id)))
  }, [initialBlocks])

  const toggleOpen = (id: string) => {
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const onSave = async () => {
    setIsSaving(true)
    try {
      const wedding = await updatePageBlocks({
        data: { page_blocks: blocks },
      })
      setBlocks(wedding.page_blocks)
      toast.success('Page content saved.')
      await router.invalidate()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Unable to save page content.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const onAdd = () => {
    const block = createDefaultBlock(addType)
    setBlocks((current) => [...current, block])
    setOpenIds((current) => new Set(current).add(block.id))
    toast.success(`${PAGE_BLOCK_TYPE_LABELS[addType]} block added.`)
  }

  const onRemove = (id: string) => {
    setBlocks((current) => current.filter((block) => block.id !== id))
    setOpenIds((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
    toast.success('Block removed. Save to publish.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="admin-page-title">Page content</h1>
          <p className="text-foreground-secondary mt-2 text-sm">
            Ordered blocks for the public home page. Reorder with up/down, then
            save.
          </p>
        </div>
        <Button type="button" onClick={onSave} isLoading={isSaving}>
          Save page
        </Button>
      </div>

      <div className="space-y-3">
        {blocks.map((block, index) => {
          const open = openIds.has(block.id)
          return (
            <div
              key={block.id}
              className="bg-surface border-border overflow-hidden rounded-xl border"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-2 text-left"
                  onClick={() => toggleOpen(block.id)}
                  aria-expanded={open}
                >
                  {open ? <CaretUp /> : <CaretDown />}
                  <span className="font-medium">
                    {PAGE_BLOCK_TYPE_LABELS[block.type]}
                  </span>
                  <Badge variant="neutral">{block.type}</Badge>
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    square
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() =>
                      setBlocks((current) =>
                        moveBlock(current, index, index - 1),
                      )
                    }
                  >
                    <CaretDoubleUp />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    square
                    aria-label="Move down"
                    disabled={index === blocks.length - 1}
                    onClick={() =>
                      setBlocks((current) =>
                        moveBlock(current, index, index + 1),
                      )
                    }
                  >
                    <CaretDoubleDown />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    square
                    aria-label="Remove block"
                    onClick={() => onRemove(block.id)}
                  >
                    <Trash />
                  </Button>
                </div>
              </div>
              {open ? (
                <div className="border-border border-t px-4 py-4">
                  <BlockEditor
                    block={block}
                    onChange={(next) =>
                      setBlocks((current) =>
                        current.map((item) =>
                          item.id === next.id ? next : item,
                        ),
                      )
                    }
                  />
                </div>
              ) : null}
            </div>
          )
        })}

        {blocks.length === 0 ? (
          <div className="bg-surface border-border rounded-xl border border-dashed p-8 text-center">
            <p className="text-foreground-secondary text-sm">
              No blocks yet. Use the form below to add sections to the home
              page.
            </p>
          </div>
        ) : null}

        <div className="bg-surface border-border flex flex-wrap items-end gap-3 rounded-xl border p-4">
          <Field className="min-w-40 flex-1">
            <Field.Label>Add block</Field.Label>
            <Field.Control>
              <Select
                value={addType}
                onChange={(event) =>
                  setAddType(event.target.value as PageBlockType)
                }
              >
                {PAGE_BLOCK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {PAGE_BLOCK_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </Field.Control>
          </Field>
          <Button type="button" variant="outline" onClick={onAdd}>
            Add block
          </Button>
        </div>
      </div>
    </div>
  )
}
