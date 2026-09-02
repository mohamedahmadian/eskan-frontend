import { Megaphone } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { HeadquartersAnnouncement } from '../../types/app'
import { HeadquartersAnnouncementForm } from './HeadquartersAnnouncementForm'

export function HeadquartersAnnouncementEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['headquarters-announcements', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersAnnouncement>(
        `/headquarters-announcements/${id}`,
      )
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersAnnouncements.edit')}
        subtitle={<EntityNameSubtitle name={query.data.title} icon={Megaphone} />}
      />
      <HeadquartersAnnouncementForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/headquarters-announcements/${id}`, payload)
          toast.success(t('headquartersAnnouncements.updated'))
          navigate(`/headquarters/announcements/${id}`)
        }}
      />
    </div>
  )
}
