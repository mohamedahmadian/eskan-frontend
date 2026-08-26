import { userScopes } from '../users/user-scopes'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function AccommodationManagerLocationPage() {
  return <RoleUserLocationPage scope={userScopes.accommodationManager} />
}
