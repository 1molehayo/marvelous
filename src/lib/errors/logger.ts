export type AppLogSource = 'ssr' | 'server' | 'client'

export type AppLogPayload = {
  /** Stable marker so Vercel log search can filter app errors. */
  kind: 'RouteError' | 'AppError'
  level: 'error' | 'warn'
  /** Same id shown as "Reference:" on the error page — search Vercel for this. */
  errorId: string
  code?: string
  status?: number
  /** Technical message for debugging (never show on the public UI). */
  message: string
  source: AppLogSource
  pathname?: string
  causeName?: string
  causeMessage?: string
  stack?: string
  causeStack?: string
  extra?: Record<string, unknown>
}

function safeString(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') return value
  try {
    return String(value)
  } catch {
    return undefined
  }
}

export function serializeUnknownCause(cause: unknown): {
  causeName?: string
  causeMessage?: string
  causeStack?: string
} {
  if (cause == null) return {}

  if (cause instanceof Error) {
    return {
      causeName: cause.name,
      causeMessage: cause.message,
      causeStack: cause.stack,
    }
  }

  if (typeof cause === 'object') {
    const record = cause as Record<string, unknown>
    return {
      causeName: safeString(record.name),
      causeMessage:
        safeString(record.message) ??
        (() => {
          try {
            return JSON.stringify(cause)
          } catch {
            return safeString(cause)
          }
        })(),
      causeStack: safeString(record.stack),
    }
  }

  return { causeMessage: safeString(cause) }
}

/**
 * One JSON line on stderr → Vercel Runtime Logs (filter/search by errorId).
 * Also keeps a readable console group label for local/devtools scanning.
 */
export function logAppError(payload: AppLogPayload) {
  const entry = {
    ...payload,
    timestamp: new Date().toISOString(),
  }

  console.error(`[${payload.kind}] ${payload.errorId}`, entry)
  console.error(JSON.stringify(entry))
}
