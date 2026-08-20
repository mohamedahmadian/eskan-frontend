export type PublicVoucherKind = 'item' | 'ice'

export function publicVoucherPath(kind: PublicVoucherKind, code: string) {
  return `/v/${kind}/${encodeURIComponent(code)}`
}

export function publicVoucherUrl(kind: PublicVoucherKind, code: string) {
  return `${window.location.origin}${publicVoucherPath(kind, code)}`
}

export function isPublicVoucherPath(pathname: string) {
  return pathname.startsWith('/v/')
}
