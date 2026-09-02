export type RoleUserScope = {
  queryKey: string
  apiBase: string
  listPath: string
  lockedRoleCodes: string[]
  i18nPrefix: 'users' | 'pilgrims' | 'accommodationManagers' | 'caravanManagers' | 'headquartersRepresentatives'
  listTitleKey: string
  hideRoles?: boolean
  hideUsername?: boolean
  hideStatus?: boolean
  hideListRoles?: boolean
  showRoleFilter?: boolean
  showAccommodations?: boolean
  showCaravans?: boolean
  showHeadquartersAreas?: boolean
  showPilgrimCard?: boolean
  hideDelete?: boolean
}

export function showUserActivityStartYear(
  i18nPrefix: RoleUserScope['i18nPrefix'],
  options?: { lockedRoleCodes?: string[]; roleCodes?: string[] },
) {
  if (i18nPrefix === 'pilgrims') return false
  if (options?.lockedRoleCodes?.includes('PILGRIM')) return false
  const codes = options?.roleCodes
  if (codes && codes.length > 0 && codes.every((code) => code === 'PILGRIM')) {
    return false
  }
  return true
}

export const userScopes: Record<string, RoleUserScope> = {
  all: {
    queryKey: 'users',
    apiBase: '/users',
    listPath: '/users',
    lockedRoleCodes: [],
    i18nPrefix: 'users',
    listTitleKey: 'menus.usersList',
    showRoleFilter: true,
  },
  pilgrim: {
    queryKey: 'pilgrims',
    apiBase: '/pilgrims',
    listPath: '/pilgrims',
    lockedRoleCodes: ['PILGRIM'],
    i18nPrefix: 'pilgrims',
    listTitleKey: 'menus.pilgrimsList',
    hideRoles: true, // create form; admin can assign extra roles on edit
    showPilgrimCard: true,
  },
  accommodationManager: {
    queryKey: 'accommodation-managers',
    apiBase: '/accommodation-managers',
    listPath: '/accommodation-managers',
    lockedRoleCodes: ['ACCOMMODATION_MANAGER'],
    i18nPrefix: 'accommodationManagers',
    listTitleKey: 'menus.accommodationManagers',
    showAccommodations: true,
  },
  caravanManager: {
    queryKey: 'caravan-managers',
    apiBase: '/caravan-managers',
    listPath: '/caravan-managers',
    lockedRoleCodes: ['CARAVAN_MANAGER'],
    i18nPrefix: 'caravanManagers',
    listTitleKey: 'menus.caravanManagers',
    hideUsername: true,
    hideStatus: true,
    hideListRoles: true,
    showCaravans: true,
    hideDelete: true,
  },
  headquartersRepresentative: {
    queryKey: 'headquarters-representatives',
    apiBase: '/headquarters-representatives',
    listPath: '/headquarters/representatives',
    lockedRoleCodes: ['HEADQUARTERS_REPRESENTATIVE'],
    i18nPrefix: 'headquartersRepresentatives',
    listTitleKey: 'menus.headquartersRepresentatives',
    showHeadquartersAreas: true,
  },
}
