import type { z } from 'zod'

/** Map a Zod error to TanStack Form `{ fields }` shape. */
export function zodFormFieldErrors(error: z.ZodError): {
  fields: Record<string, string>
} {
  const fields: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.')
    if (!key || fields[key]) continue
    fields[key] = issue.message
  }
  return { fields }
}
