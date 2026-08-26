import { userScopes } from '../users/user-scopes'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function PilgrimLocationPage() {
  return <RoleUserLocationPage scope={userScopes.pilgrim} />
}
