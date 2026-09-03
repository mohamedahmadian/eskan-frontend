const PUBLIC_LANDING_PREFIXES = [
  '/participations',
  '/news/',
  '/announcements/',
] as const

export function isPublicSessionPath(pathname: string) {
  return (
    pathname === '/' ||
    pathname === '/about' ||
    pathname === '/contact' ||
    PUBLIC_LANDING_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/impersonate') ||
    pathname.startsWith('/v/') ||
    pathname.startsWith('/p/') ||
    pathname.startsWith('/a/') ||
    pathname.startsWith('/s/')
  )
}
