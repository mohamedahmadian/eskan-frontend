import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { HeadquartersAnnouncementForm } from './HeadquartersAnnouncementForm'

export function HeadquartersAnnouncementCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersAnnouncements.create')}
        subtitle={t('headquartersAnnouncements.createSubtitle')}
      />
      <HeadquartersAnnouncementForm
        onSubmit={async (payload) => {
          const { data } = await api.post<{ id: string }>('/headquarters-announcements', payload)
          toast.success(t('headquartersAnnouncements.created'))
          navigate(`/headquarters/announcements/${data.id}`)
        }}
      />
    </div>
  )
}
