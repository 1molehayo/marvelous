export type RouteErrorStatus = 403 | 404 | 500

export type RouteErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ADMIN_FORBIDDEN'
  | 'INTERNAL'

export type RouteErrorCopy = {
  status: RouteErrorStatus
  title: string
  message: string
}

/**
 * Stable code → user copy map (extend as new access errors appear).
 * Technical details stay on `RouteError.message` for logs only.
 */
export const ROUTE_ERROR_COPY: Record<RouteErrorCode, RouteErrorCopy> = {
  NOT_FOUND: {
    status: 404,
    title: 'Page not found',
    message: "That link doesn't match anything on this site.",
  },
  UNAUTHORIZED: {
    status: 403,
    title: 'Sign in required',
    message: 'You need to sign in before you can open this page.',
  },
  FORBIDDEN: {
    status: 403,
    title: 'Access denied',
    message:
      "You don't have permission to view this page. Ask a super admin if you need access.",
  },
  ADMIN_FORBIDDEN: {
    status: 403,
    title: 'Access denied',
    message:
      'Only a super admin can open this page. Ask your super admin if you need access.',
  },
  INTERNAL: {
    status: 500,
    title: 'Something went wrong',
    message:
      'We hit an unexpected problem loading this page. Please try again in a moment.',
  },
}

function createErrorId() {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export class RouteError extends Error {
  readonly status: RouteErrorStatus
  readonly code: RouteErrorCode
  readonly errorId: string
  readonly publicTitle: string
  readonly publicMessage: string

  constructor(input: {
    status?: RouteErrorStatus
    code: RouteErrorCode
    /** Technical detail for logs — not shown to users. */
    message: string
    publicTitle?: string
    publicMessage?: string
    cause?: unknown
    errorId?: string
  }) {
    const defaults = ROUTE_ERROR_COPY[input.code]
    super(input.message, { cause: input.cause })
    this.name = 'RouteError'
    this.status = input.status ?? defaults.status
    this.code = input.code
    this.errorId = input.errorId ?? createErrorId()
    this.publicTitle = input.publicTitle ?? defaults.title
    this.publicMessage = input.publicMessage ?? defaults.message
  }
}

export function isRouteError(error: unknown): error is RouteError {
  return error instanceof RouteError
}

export function unauthorized(input: {
  message: string
  publicTitle?: string
  publicMessage?: string
  cause?: unknown
}) {
  return new RouteError({
    code: 'UNAUTHORIZED',
    message: input.message,
    publicTitle: input.publicTitle,
    publicMessage: input.publicMessage,
    cause: input.cause,
  })
}

export function forbidden(input: {
  code?: Extract<RouteErrorCode, 'FORBIDDEN' | 'ADMIN_FORBIDDEN'>
  message: string
  publicTitle?: string
  publicMessage?: string
  cause?: unknown
}) {
  return new RouteError({
    code: input.code ?? 'FORBIDDEN',
    message: input.message,
    publicTitle: input.publicTitle,
    publicMessage: input.publicMessage,
    cause: input.cause,
  })
}

export function notFoundError(input: {
  message: string
  publicTitle?: string
  publicMessage?: string
  cause?: unknown
}) {
  return new RouteError({
    code: 'NOT_FOUND',
    message: input.message,
    publicTitle: input.publicTitle,
    publicMessage: input.publicMessage,
    cause: input.cause,
  })
}

export function internalError(input: {
  message: string
  publicTitle?: string
  publicMessage?: string
  cause?: unknown
}) {
  return new RouteError({
    code: 'INTERNAL',
    message: input.message,
    publicTitle: input.publicTitle,
    publicMessage: input.publicMessage,
    cause: input.cause,
  })
}

/** Map any thrown value into a RouteError for the page error boundary. */
export function normalizeRouteError(error: unknown): RouteError {
  if (isRouteError(error)) {
    return error
  }

  if (error instanceof Error) {
    return internalError({
      message: error.message || 'Unexpected route error',
      cause: error,
    })
  }

  return internalError({
    message: 'Unexpected non-Error throw during route load',
    cause: error,
  })
}

export function logRouteError(routeError: RouteError, original?: unknown) {
  console.error('[RouteError]', {
    errorId: routeError.errorId,
    code: routeError.code,
    status: routeError.status,
    message: routeError.message,
    cause: routeError.cause ?? original,
    stack: routeError.stack,
  })
}
