import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import { ContributionForm } from './ContributionForm'

export function ContributionCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('contributions.create')} subtitle={t('contributions.createSubtitle')} />
      <ContributionForm
        onSubmit={async (payload) => {
          await api.post('/contributions', payload)
          toast.success(t('contributions.created'))
          await queryClient.invalidateQueries({ queryKey: ['contributions'] })
          await queryClient.invalidateQueries({ queryKey: ['participation-campaigns'] })
          navigate('/participations/contributions')
        }}
      />
    </div>
  )
}
