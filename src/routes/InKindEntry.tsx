import { useAuth } from '../auth/AuthProvider'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { LoadingState } from '../components/ui/LoadingState'
import { PublicInKindPage } from '../pages/landing/PublicInKindPage'
import { InKindPage } from '../pages/participations/InKindPage'
import { canAccessParticipationInKind } from './RequireMenuAccess'

export function InKindEntry() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState variant="fullscreen" />
  }

  if (canAccessParticipationInKind(user)) {
    return (
      <DashboardLayout>
        <InKindPage />
      </DashboardLayout>
    )
  }

  return <PublicInKindPage />
}
