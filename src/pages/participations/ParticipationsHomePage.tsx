import { Megaphone } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button, LoadingState, PageHeader, listShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ParticipationCampaign } from '../../types/app'
import { CampaignCard } from './CampaignCard'

export function ParticipationsHomePage() {
  const { t } = useTranslation()
  const query = useQuery({
    queryKey: ['participation-campaigns', 'showcase'],
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign[]>('/participation-campaigns/showcase')
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={`${listShellClassName} space-y-6`}>
      <PageHeader
        title={t('participations.title')}
        subtitle={t('participations.subtitle')}
        action={
          <Link to="/participations/campaigns">
            <Button variant="soft">
              <Megaphone className="size-4" aria-hidden />
              {t('participations.viewCampaigns')}
            </Button>
          </Link>
        }
      />
      {query.data.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.map((item) => (
            <CampaignCard
              key={item.id}
              item={item}
              to={`/participations/campaigns/${item.id}`}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl border border-dashed border-line bg-white px-5 py-16 text-center text-sm text-ink-500">
          {t('participations.empty')}
        </p>
      )}
    </div>
  )
}
