/** Public app origin for absolute links (emails, OG, canonical). */
export function getAppUrl(): string {
  const fromEnv =
    process.env.APP_URL?.trim() ||
    process.env.VITE_APP_URL?.trim() ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (fromEnv) {
    return fromEnv.startsWith('http')
      ? fromEnv.replace(/\/$/, '')
      : `https://${fromEnv.replace(/\/$/, '')}`
  }
  return 'http://localhost:3000'
}
