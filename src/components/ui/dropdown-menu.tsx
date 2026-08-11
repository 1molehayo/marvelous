import { useEffect, useId, useRef, useState } from 'react'
import { DotsThree } from '@phosphor-icons/react'
import { IconButton } from '#/components/ui/button'
import { cn } from '#/lib/utils'

export type DropdownMenuItem = {
  id: string
  label: string
  onSelect: () => void
  tone?: 'default' | 'destructive'
  disabled?: boolean
}

export function DropdownMenu({
  label = 'Actions',
  items,
  align = 'end',
}: {
  label?: string
  items: DropdownMenuItem[]
  align?: 'start' | 'end'
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-flex" data-row-stop>
      <IconButton
        type="button"
        size="sm"
        variant="outline"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <DotsThree weight="bold" />
      </IconButton>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'border-border bg-background absolute z-40 mt-1 min-w-44 rounded-xl border py-1 shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              className={cn(
                'hover:bg-foreground/5 flex w-full px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40',
                item.tone === 'destructive' && 'text-error',
              )}
              onClick={() => {
                if (item.disabled) return
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
