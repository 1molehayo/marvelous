import { PAGE_BLOCK_TYPES } from '#/lib/page-blocks/types'
import type {
  DetailsBlockFields,
  HeroBlockFields,
  ImageBlockFields,
  PageBlock,
  PageBlockType,
  StoryBlockFields,
} from '#/lib/page-blocks/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') {
    throw new Error('Expected a string or null.')
  }
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string.`)
  }
  return value.trim()
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean.`)
  }
  return value
}

function parseHeroFields(fields: unknown): HeroBlockFields {
  if (!isRecord(fields)) {
    throw new Error('Hero block fields are invalid.')
  }
  return {
    title: asNullableString(fields.title),
    tagline: asNullableString(fields.tagline),
  }
}

function parseStoryFields(fields: unknown): StoryBlockFields {
  if (!isRecord(fields)) {
    throw new Error('Story block fields are invalid.')
  }
  return {
    title: asString(fields.title, 'Story title'),
    body: asString(fields.body, 'Story body'),
  }
}

function parseImageFields(fields: unknown): ImageBlockFields {
  if (!isRecord(fields)) {
    throw new Error('Image block fields are invalid.')
  }
  return {
    imagePath: asString(fields.imagePath, 'Image path'),
    title: asNullableString(fields.title),
    description: asNullableString(fields.description),
  }
}

function parseDetailsFields(fields: unknown): DetailsBlockFields {
  if (!isRecord(fields)) {
    throw new Error('Details block fields are invalid.')
  }
  return {
    showVenue: asBoolean(fields.showVenue, 'showVenue'),
    showDressCode: asBoolean(fields.showDressCode, 'showDressCode'),
  }
}

export function parsePageBlock(value: unknown): PageBlock {
  if (!isRecord(value)) {
    throw new Error('Each page block must be an object.')
  }

  const id = asString(value.id, 'Block id')
  if (!id) {
    throw new Error('Block id is required.')
  }

  const type = value.type
  if (
    typeof type !== 'string' ||
    !PAGE_BLOCK_TYPES.includes(type as PageBlockType)
  ) {
    throw new Error(`Unsupported block type: ${String(type)}`)
  }

  switch (type as PageBlockType) {
    case 'hero':
      return { id, type: 'hero', fields: parseHeroFields(value.fields) }
    case 'story':
      return { id, type: 'story', fields: parseStoryFields(value.fields) }
    case 'image':
      return { id, type: 'image', fields: parseImageFields(value.fields) }
    case 'details':
      return { id, type: 'details', fields: parseDetailsFields(value.fields) }
  }
}

export function parsePageBlocks(value: unknown): PageBlock[] {
  if (!Array.isArray(value)) {
    throw new Error('page_blocks must be an array.')
  }

  const blocks = value.map(parsePageBlock)
  const ids = new Set<string>()
  for (const block of blocks) {
    if (ids.has(block.id)) {
      throw new Error('Duplicate page block ids are not allowed.')
    }
    ids.add(block.id)
  }
  return blocks
}

export function parseUpdatePageBlocksInput(data: unknown): {
  page_blocks: PageBlock[]
} {
  if (!isRecord(data)) {
    throw new Error('Invalid page blocks payload.')
  }
  return {
    page_blocks: parsePageBlocks(data.page_blocks),
  }
}
