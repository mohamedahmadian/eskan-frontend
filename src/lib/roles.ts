import type { TFunction } from 'i18next'
import type { RoleOption } from '../types/app'

export type RoleUser = {
  roles?: { code: string }[]
  hasGroup?: boolean
  managesAccommodation?: boolean
} | null | undefined

export function hasRole(user: RoleUser, code: string) {
  return user?.roles?.some((role) => role.code === code) ?? false
}

export function isAdmin(user: RoleUser) {
  return hasRole(user, 'ADMIN')
}

export function isPilgrim(user: RoleUser) {
  return hasRole(user, 'PILGRIM')
}

export function isCaravanManager(user: RoleUser) {
  return hasRole(user, 'CARAVAN_MANAGER')
}

export function isAccommodationManager(user: RoleUser) {
  return hasRole(user, 'ACCOMMODATION_MANAGER')
}

export function isGroupManager(user: RoleUser) {
  return hasRole(user, 'GROUP_MANAGER')
}

export function isLicenseIssuer(user: RoleUser) {
  return hasRole(user, 'LICENSE_ISSUER')
}

export function isUnitManager(user: RoleUser) {
  return hasRole(user, 'UNIT_MANAGER')
}

export function isGovernmentOrgOfficer(user: RoleUser) {
  return hasRole(user, 'GOVERNMENT_ORG_OFFICER')
}

/** زائر فقط با گروه یا مدیریت اسکان منوهای گروه/اسکان/ارزیابی را می‌بیند */
export function pilgrimHasGroupOrHousingAccess(user: RoleUser) {
  return (
    isGroupManager(user) ||
    isAccommodationManager(user) ||
    Boolean(user?.hasGroup) ||
    Boolean(user?.managesAccommodation)
  )
}

export function canAccessMyCaravans(user: RoleUser) {
  return isAdmin(user) || isCaravanManager(user)
}

export function canAccessMyReservations(user: RoleUser) {
  return (
    !isAdmin(user) &&
    (isPilgrim(user) || isCaravanManager(user) || isGroupManager(user))
  )
}

export function canAccessMyGroups(user: RoleUser) {
  if (isAdmin(user) || isGroupManager(user) || isCaravanManager(user)) {
    return true
  }
  return isPilgrim(user) && pilgrimHasGroupOrHousingAccess(user)
}

export function canAccessMyAccommodations(user: RoleUser) {
  if (!user || isAdmin(user)) return false
  if (isPilgrim(user) && !isCaravanManager(user) && !pilgrimHasGroupOrHousingAccess(user)) {
    return false
  }
  return true
}

export function canAccessMyEvaluations(user: RoleUser) {
  if (!user || isAdmin(user)) return false
  if (isPilgrim(user) && !isCaravanManager(user) && !pilgrimHasGroupOrHousingAccess(user)) {
    return false
  }
  return true
}

export function usesDedicatedHomeDashboard(user: RoleUser) {
  return (
    !isAdmin(user) &&
    (isPilgrim(user) ||
      isCaravanManager(user) ||
      isGroupManager(user) ||
      isLicenseIssuer(user) ||
      isGovernmentOrgOfficer(user))
  )
}

export function formatRoles(
  roles: Pick<RoleOption, 'nameKey'>[] | undefined,
  t: TFunction,
) {
  if (!roles?.length) return '—'
  return roles.map((role) => t(role.nameKey)).join('، ')
}
