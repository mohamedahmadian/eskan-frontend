import { useAuth } from '../auth/AuthProvider'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { LoadingState } from '../components/ui/LoadingState'
import { PublicCampaignsPage } from '../pages/landing/PublicCampaignsPage'
import { CampaignsListPage } from '../pages/participations/CampaignsListPage'
import { canAccessParticipationCampaigns } from './RequireMenuAccess'

export function CampaignsEntry() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingState variant="fullscreen" />
  }

  if (canAccessParticipationCampaigns(user)) {
    return (
      <DashboardLayout>
        <CampaignsListPage />
      </DashboardLayout>
    )
  }

  return <PublicCampaignsPage />
}
