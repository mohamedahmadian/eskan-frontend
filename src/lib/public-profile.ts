export function publicProfilePath(userId: string) {
  return `/zaer/${encodeURIComponent(userId)}`
}

export function publicProfileUrl(userId: string) {
  return `${window.location.origin}${publicProfilePath(userId)}`
}
