import { userScopes } from '../users/user-scopes'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function CaravanManagerLocationPage() {
  return <RoleUserLocationPage scope={userScopes.caravanManager} />
}
