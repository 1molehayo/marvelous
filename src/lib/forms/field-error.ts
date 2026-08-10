/** Normalize TanStack Form / Standard Schema field errors to a single message. */
export function fieldErrorMessage(errors: unknown): string | undefined {
  if (!Array.isArray(errors) || errors.length === 0) return undefined

  const first = errors[0]
  if (typeof first === 'string') return first
  if (
    typeof first === 'object' &&
    first !== null &&
    'message' in first &&
    typeof (first as { message: unknown }).message === 'string'
  ) {
    return (first as { message: string }).message
  }
  return String(first)
}
