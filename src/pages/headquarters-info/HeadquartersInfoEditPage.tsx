import { Landmark } from 'lucide-react'
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
import { useInvalidateHeadquartersBranding } from '../../hooks/useHeadquartersSummary'
import type { HeadquartersInfo } from '../../types/app'
import { HeadquartersInfoForm } from './HeadquartersInfoForm'

export function HeadquartersInfoEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const invalidateBranding = useInvalidateHeadquartersBranding()
  const item = useQuery({
    queryKey: ['headquarters-info', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersInfo>(`/headquarters-info/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersInfo.edit')}
        subtitle={<EntityNameSubtitle name={item.data.name} icon={Landmark} />}
      />
      <HeadquartersInfoForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/headquarters-info/${id}`, payload)
          await invalidateBranding()
          toast.success(t('headquartersInfo.updated'))
          navigate(`/headquarters/info/${id}`)
        }}
      />
    </div>
  )
}
