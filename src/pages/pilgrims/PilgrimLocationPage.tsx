import { userScopes } from '../users/user-scopes'
import { RoleUserLocationHistoryPage } from '../location/LocationHistoryPage'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function PilgrimLocationPage() {
  return <RoleUserLocationPage scope={userScopes.pilgrim} />
}

export function PilgrimLocationHistoryPage() {
  return <RoleUserLocationHistoryPage scope={userScopes.pilgrim} />
}
