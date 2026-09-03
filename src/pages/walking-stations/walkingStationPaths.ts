export function walkingStationBasePath(pathname: string) {
  return pathname.startsWith('/my-walking-stations')
    ? '/my-walking-stations'
    : '/base-info/walking-stations'
}
