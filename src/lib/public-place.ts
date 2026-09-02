export function publicAccommodationPath(id: string) {
  return `/a/${encodeURIComponent(id)}`
}

export function publicAccommodationUrl(id: string) {
  return `${window.location.origin}${publicAccommodationPath(id)}`
}

export function publicWalkingStationPath(id: string) {
  return `/s/${encodeURIComponent(id)}`
}

export function publicWalkingStationUrl(id: string) {
  return `${window.location.origin}${publicWalkingStationPath(id)}`
}
