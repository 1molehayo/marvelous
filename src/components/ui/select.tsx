import type { VariantProps } from 'cva'
import { inputStyle } from '#/components/ui/input'
import { cn } from '#/lib/utils'

export interface SelectProps
  extends
    Omit<React.ComponentPropsWithRef<'select'>, 'size'>,
    VariantProps<typeof inputStyle> {
  invalid?: boolean
}

const Select = ({
  className,
  invalid,
  variant,
  size,
  ref,
  ...props
}: SelectProps) => {
  return (
    <select
      ref={ref}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      className={cn(
        inputStyle({ variant, size }),
        'appearance-none bg-size-[1em] bg-position-[right_--spacing(2)_center] bg-no-repeat pr-10',
        'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSJibGFjayIgZD0iTTMuNyA1LjNsNC4zIDQuMyA0LjMtNC4zLjcuNy01IDUtNS01eiIvPjwvc3ZnPg==")]',
        'dark:bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij48cGF0aCBmaWxsPSJ3aGl0ZSIgZD0iTTMuNyA1LjNsNC4zIDQuMyA0LjMtNC4zLjcuNy01IDUtNS01eiIvPjwvc3ZnPg==")]',
        className,
      )}
      {...props}
    />
  )
}

export { Select }
