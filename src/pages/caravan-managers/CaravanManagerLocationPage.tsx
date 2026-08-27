import { userScopes } from '../users/user-scopes'
import { RoleUserLocationHistoryPage } from '../location/LocationHistoryPage'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function CaravanManagerLocationPage() {
  return <RoleUserLocationPage scope={userScopes.caravanManager} />
}

export function CaravanManagerLocationHistoryPage() {
  return <RoleUserLocationHistoryPage scope={userScopes.caravanManager} />
}
