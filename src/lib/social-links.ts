export type SocialNetwork = 'website' | 'eitaa' | 'bale' | 'telegram' | 'instagram'

const networkHosts: Record<Exclude<SocialNetwork, 'website'>, string> = {
  eitaa: 'https://eitaa.com/',
  bale: 'https://ble.ir/',
  telegram: 'https://t.me/',
  instagram: 'https://instagram.com/',
}

export function toExternalHref(value: string, network: SocialNetwork): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (network === 'website') {
    return `https://${trimmed.replace(/^\/+/, '')}`
  }
  const handle = trimmed.replace(/^@/, '').replace(/^\/+/, '')
  if (/^[a-z0-9.-]+\.[a-z]{2,}\//i.test(handle)) {
    return `https://${handle}`
  }
  return `${networkHosts[network]}${handle}`
}

export function displayExternalUrl(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
}
