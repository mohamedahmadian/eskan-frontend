import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { HeadquartersNewsForm } from './HeadquartersNewsForm'

export function HeadquartersNewsCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('headquartersNews.create')} subtitle={t('headquartersNews.createSubtitle')} />
      <HeadquartersNewsForm
        onSubmit={async (payload) => {
          const { data } = await api.post<{ id: string }>('/headquarters-news', payload)
          toast.success(t('headquartersNews.created'))
          navigate(`/headquarters/news/${data.id}`)
        }}
      />
    </div>
  )
}
