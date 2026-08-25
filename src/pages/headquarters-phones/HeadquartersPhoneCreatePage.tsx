import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { useInvalidateHeadquartersBranding } from '../../hooks/useHeadquartersSummary'
import type { HeadquartersInfo } from '../../types/app'
import { HeadquartersPhoneForm } from './HeadquartersPhoneForm'

export function HeadquartersPhoneCreatePage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const invalidateBranding = useInvalidateHeadquartersBranding()
  const headquarters = useQuery({
    queryKey: ['headquarters-info', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersInfo>(`/headquarters-info/${id}`)
      return data
    },
  })

  if (!headquarters.data || !id) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersPhones.create')}
        subtitle={t('headquartersPhones.createSubtitle')}
      />
      <HeadquartersPhoneForm
        headquarters={headquarters.data}
        onSubmit={async (payload) => {
          await api.post('/headquarters-phones', payload)
          await invalidateBranding()
          toast.success(t('headquartersPhones.created'))
          navigate(`/headquarters/info/${id}/phones`)
        }}
      />
    </div>
  )
}
