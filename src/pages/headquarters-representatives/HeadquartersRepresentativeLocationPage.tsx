import { userScopes } from '../users/user-scopes'
import { RoleUserLocationPage } from '../location/RoleUserLocationPage'

export function HeadquartersRepresentativeLocationPage() {
  return <RoleUserLocationPage scope={userScopes.headquartersRepresentative} />
}
