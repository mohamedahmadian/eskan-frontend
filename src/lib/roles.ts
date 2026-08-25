import type { TFunction } from 'i18next'
import type { RoleOption } from '../types/app'

export function hasRole(
  user: { roles?: { code: string }[] } | null | undefined,
  code: string,
) {
  return user?.roles?.some((role) => role.code === code) ?? false
}

export function isAdmin(user: { roles?: { code: string }[] } | null | undefined) {
  return hasRole(user, 'ADMIN')
}

export function isPilgrim(user: { roles?: { code: string }[] } | null | undefined) {
  return hasRole(user, 'PILGRIM')
}

export function isCaravanManager(user: { roles?: { code: string }[] } | null | undefined) {
  return hasRole(user, 'CARAVAN_MANAGER')
}

export function isGroupManager(user: { roles?: { code: string }[] } | null | undefined) {
  return hasRole(user, 'GROUP_MANAGER')
}

export function isLicenseIssuer(user: { roles?: { code: string }[] } | null | undefined) {
  return hasRole(user, 'LICENSE_ISSUER')
}

export function isUnitManager(user: { roles?: { code: string }[] } | null | undefined) {
  return hasRole(user, 'UNIT_MANAGER')
}

export function canAccessMyCaravans(user: { roles?: { code: string }[] } | null | undefined) {
  return isAdmin(user) || isCaravanManager(user)
}

export function canAccessMyReservations(
  user: { roles?: { code: string }[] } | null | undefined,
) {
  return (
    !isAdmin(user) &&
    (isPilgrim(user) || isCaravanManager(user) || isGroupManager(user))
  )
}

export function canAccessMyGroups(user: { roles?: { code: string }[] } | null | undefined) {
  return (
    isAdmin(user) ||
    isGroupManager(user) ||
    isCaravanManager(user) ||
    isPilgrim(user)
  )
}

export function canAccessMyAccommodations(
  user: { roles?: { code: string }[] } | null | undefined,
) {
  return Boolean(user) && !isAdmin(user)
}

export function usesDedicatedHomeDashboard(
  user: { roles?: { code: string }[] } | null | undefined,
) {
  return (
    !isAdmin(user) &&
    (isPilgrim(user) || isCaravanManager(user) || isGroupManager(user) || isLicenseIssuer(user))
  )
}

export function formatRoles(
  roles: Pick<RoleOption, 'nameKey'>[] | undefined,
  t: TFunction,
) {
  if (!roles?.length) return '—'
  return roles.map((role) => t(role.nameKey)).join('، ')
}
