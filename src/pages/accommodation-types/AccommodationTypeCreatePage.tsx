import { Tags } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { AccommodationType } from '../../types/app'
import { AccommodationTypeForm } from './AccommodationTypeForm'

export function AccommodationTypeCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Tags}
        title={t('accommodationType.create')}
        subtitle={t('accommodationType.createSubtitle')}
      />
      <AccommodationTypeForm
        onSubmit={async (payload) => {
          await api.post<AccommodationType>('/accommodation-types', payload)
          toast.success(t('accommodationType.created'))
          navigate('/accommodation-types')
        }}
      />
    </div>
  )
}
