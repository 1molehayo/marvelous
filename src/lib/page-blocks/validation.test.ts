import { describe, expect, it } from 'vitest'
import { createDefaultPageBlocks } from '#/lib/page-blocks/types'
import { parsePageBlocks } from '#/lib/page-blocks/validation'

describe('page blocks validation', () => {
  it('accepts the default seed blocks', () => {
    const blocks = createDefaultPageBlocks()
    expect(parsePageBlocks(blocks)).toHaveLength(3)
  })

  it('rejects unknown block types', () => {
    expect(() =>
      parsePageBlocks([
        {
          id: '1',
          type: 'gallery',
          fields: {},
        },
      ]),
    ).toThrow(/Unsupported block type/)
  })
})
