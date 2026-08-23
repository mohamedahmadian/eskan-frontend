import type { TFunction } from 'i18next'
import type { AuthUser, RoleOption } from '../types/app'

export function hasRole(
  user: { roles?: { code: string }[] } | null | undefined,
  code: string,
) {
  return user?.roles?.some((role) => role.code === code) ?? false
}

export function isAdmin(user: AuthUser | null | undefined) {
  return hasRole(user, 'ADMIN')
}

export function isPilgrim(user: AuthUser | null | undefined) {
  return hasRole(user, 'PILGRIM')
}

export function isCaravanManager(user: AuthUser | null | undefined) {
  return hasRole(user, 'CARAVAN_MANAGER')
}

export function canAccessMyCaravans(user: AuthUser | null | undefined) {
  return isAdmin(user) || isCaravanManager(user)
}

export function usesDedicatedHomeDashboard(user: AuthUser | null | undefined) {
  return !isAdmin(user) && (isPilgrim(user) || isCaravanManager(user))
}

export function formatRoles(
  roles: Pick<RoleOption, 'nameKey'>[] | undefined,
  t: TFunction,
) {
  if (!roles?.length) return '—'
  return roles.map((role) => t(role.nameKey)).join('، ')
}
