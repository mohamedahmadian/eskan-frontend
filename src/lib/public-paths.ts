export function isPublicSessionPath(pathname: string) {
  return (
    pathname.startsWith('/welcome') ||
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
