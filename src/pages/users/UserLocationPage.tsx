import { userScopes } from './user-scopes'
import { RoleUserLocationHistoryPage } from '../location/LocationHistoryPage'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function UserLocationPage() {
  return <RoleUserLocationPage scope={userScopes.all} />
}

export function UserLocationHistoryPage() {
  return <RoleUserLocationHistoryPage scope={userScopes.all} />
}
