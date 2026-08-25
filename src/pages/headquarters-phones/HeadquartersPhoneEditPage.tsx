import { Phone } from 'lucide-react'
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
import { localizeDigits } from '../../lib/datetime'
import type { HeadquartersPhone } from '../../types/app'
import { HeadquartersPhoneForm } from './HeadquartersPhoneForm'

export function HeadquartersPhoneEditPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id, phoneId } = useParams()
  const navigate = useNavigate()
  const invalidateBranding = useInvalidateHeadquartersBranding()
  const item = useQuery({
    queryKey: ['headquarters-phone', phoneId],
    enabled: Boolean(phoneId),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersPhone>(`/headquarters-phones/${phoneId}`)
      return data
    },
  })

  if (!item.data || !id) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersPhones.edit')}
        subtitle={
          <EntityNameSubtitle name={localizeDigits(item.data.phone, locale)} icon={Phone} />
        }
      />
      <HeadquartersPhoneForm
        headquarters={item.data.headquarters ?? { id, name: '' }}
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/headquarters-phones/${phoneId}`, payload)
          await invalidateBranding()
          toast.success(t('headquartersPhones.updated'))
          navigate(`/headquarters/info/${id}/phones/${phoneId}`)
        }}
      />
    </div>
  )
}
