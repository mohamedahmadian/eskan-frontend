import { userScopes } from './user-scopes'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function UserLocationPage() {
  return <RoleUserLocationPage scope={userScopes.all} />
}
