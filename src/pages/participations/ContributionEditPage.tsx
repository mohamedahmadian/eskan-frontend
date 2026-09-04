import { HandCoins } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EntityNameSubtitle, LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { Contribution } from '../../types/app'
import { ContributionForm } from './ContributionForm'

export function ContributionEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const item = useQuery({
    queryKey: ['contribution', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Contribution>(`/contributions/${id}`)
      return data
    },
  })

  if (!item.data) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('contributions.edit')}
        subtitle={<EntityNameSubtitle name={item.data.benefactor.name} icon={HandCoins} />}
      />
      <ContributionForm
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/contributions/${id}`, payload)
          toast.success(t('contributions.updated'))
          await queryClient.invalidateQueries({ queryKey: ['contributions'] })
          await queryClient.invalidateQueries({ queryKey: ['contribution', id] })
          await queryClient.invalidateQueries({ queryKey: ['participation-campaigns'] })
          navigate(`/participations/contributions/${id}`)
        }}
      />
    </div>
  )
}
