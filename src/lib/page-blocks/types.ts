export const PAGE_BLOCK_TYPES = [
  'hero',
  'story',
  'image',
  'details',
] as const

export type PageBlockType = (typeof PAGE_BLOCK_TYPES)[number]

export type HeroBlockFields = {
  title: string | null
  tagline: string | null
}

export type StoryBlockFields = {
  title: string
  body: string
}

export type ImageBlockFields = {
  imagePath: string
  title: string | null
  description: string | null
}

export type DetailsBlockFields = {
  showVenue: boolean
  showDressCode: boolean
}

export type HeroPageBlock = {
  id: string
  type: 'hero'
  fields: HeroBlockFields
}

export type StoryPageBlock = {
  id: string
  type: 'story'
  fields: StoryBlockFields
}

export type ImagePageBlock = {
  id: string
  type: 'image'
  fields: ImageBlockFields
}

export type DetailsPageBlock = {
  id: string
  type: 'details'
  fields: DetailsBlockFields
}

export type PageBlock =
  | HeroPageBlock
  | StoryPageBlock
  | ImagePageBlock
  | DetailsPageBlock

export const PAGE_BLOCK_TYPE_LABELS: Record<PageBlockType, string> = {
  hero: 'Hero',
  story: 'Story',
  image: 'Image',
  details: 'Details',
}

export function createDefaultBlock(type: PageBlockType): PageBlock {
  const id = crypto.randomUUID()

  switch (type) {
    case 'hero':
      return {
        id,
        type: 'hero',
        fields: {
          title: null,
          tagline: "We're getting married",
        },
      }
    case 'story':
      return {
        id,
        type: 'story',
        fields: {
          title: 'Our story',
          body: '',
        },
      }
    case 'image':
      return {
        id,
        type: 'image',
        fields: {
          imagePath: '',
          title: null,
          description: null,
        },
      }
    case 'details':
      return {
        id,
        type: 'details',
        fields: {
          showVenue: true,
          showDressCode: true,
        },
      }
  }
}

export function createDefaultPageBlocks(): PageBlock[] {
  return [
    createDefaultBlock('hero'),
    createDefaultBlock('story'),
    createDefaultBlock('details'),
  ]
}
