/** Normalize a name fragment for duplicate comparison (slug-like). */
export function slugifyNamePart(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

/** Stable key for first+last name duplicate matching. */
export function guestNameKey(firstName: string, lastName: string): string {
  return `${slugifyNamePart(firstName)}${slugifyNamePart(lastName)}`
}
