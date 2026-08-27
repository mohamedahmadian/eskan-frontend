import { userScopes } from '../users/user-scopes'
import { RoleUserLocationHistoryPage } from '../location/LocationHistoryPage'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function AccommodationManagerLocationPage() {
  return <RoleUserLocationPage scope={userScopes.accommodationManager} />
}

export function AccommodationManagerLocationHistoryPage() {
  return <RoleUserLocationHistoryPage scope={userScopes.accommodationManager} />
}
