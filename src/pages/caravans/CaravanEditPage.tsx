import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Caravan } from '../../types/app'
import { CaravanForm } from './CaravanForm'

export function CaravanEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })

  if (!query.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('caravans.edit')} subtitle={t('caravans.editSubtitle')} />
      <CaravanForm
        initial={query.data}
        onSubmit={async (payload) => {
          await api.patch(`/caravans/${id}`, payload)
          toast.success(t('caravans.updated'))
          navigate(`/caravans/${id}`)
        }}
      />
    </div>
  )
}
