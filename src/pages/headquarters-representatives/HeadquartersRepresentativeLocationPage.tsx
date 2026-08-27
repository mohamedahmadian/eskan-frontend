import { userScopes } from '../users/user-scopes'
import { RoleUserLocationHistoryPage } from '../location/LocationHistoryPage'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function HeadquartersRepresentativeLocationPage() {
  return <RoleUserLocationPage scope={userScopes.headquartersRepresentative} />
}

export function HeadquartersRepresentativeLocationHistoryPage() {
  return <RoleUserLocationHistoryPage scope={userScopes.headquartersRepresentative} />
}
