export function isPublicSessionPath(pathname: string) {
  return (
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/v/')
  )
}
