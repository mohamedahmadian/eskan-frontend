export type RoleUserScope = {
  queryKey: string
  apiBase: string
  listPath: string
  lockedRoleCodes: string[]
  i18nPrefix: 'users' | 'pilgrims' | 'accommodationManagers' | 'caravanManagers' | 'headquartersRepresentatives'
  listTitleKey: string
  hideRoles?: boolean
  showRoleFilter?: boolean
  showAccommodations?: boolean
  showHeadquartersAreas?: boolean
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
    hideRoles: true,
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
