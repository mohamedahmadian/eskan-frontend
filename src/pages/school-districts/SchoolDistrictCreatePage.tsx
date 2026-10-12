import { School } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { SchoolDistrict } from '../../types/app'
import { SchoolDistrictForm } from './SchoolDistrictForm'

export function SchoolDistrictCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={School}
        title={t('schoolDistricts.create')}
        subtitle={t('schoolDistricts.createSubtitle')}
      />
      <SchoolDistrictForm
        onSubmit={async (payload) => {
          const { data } = await api.post<SchoolDistrict>('/school-districts', payload)
          toast.success(t('schoolDistricts.created'))
          navigate(`/accommodation-base-info/schools/${data.id}`)
        }}
      />
    </div>
  )
}
