import { Newspaper } from 'lucide-react'
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
import type { HeadquartersNews } from '../../types/app'
import { HeadquartersNewsForm } from './HeadquartersNewsForm'

export function HeadquartersNewsEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['headquarters-news', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersNews>(`/headquarters-news/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersNews.edit')}
        subtitle={<EntityNameSubtitle name={query.data.title} icon={Newspaper} />}
      />
      <HeadquartersNewsForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/headquarters-news/${id}`, payload)
          toast.success(t('headquartersNews.updated'))
          navigate(`/headquarters/news/${id}`)
        }}
      />
    </div>
  )
}
