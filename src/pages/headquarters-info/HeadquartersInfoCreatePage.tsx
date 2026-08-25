import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, formShellClassName } from '../../components/ui/Form'
import { useInvalidateHeadquartersBranding } from '../../hooks/useHeadquartersSummary'
import { api } from '../../lib/api'
import type { HeadquartersInfo, Paginated } from '../../types/app'
import { HeadquartersInfoForm } from './HeadquartersInfoForm'

export function HeadquartersInfoCreatePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const invalidateBranding = useInvalidateHeadquartersBranding()
  const existing = useQuery({
    queryKey: ['headquarters-info', 'list', 'singleton-check'],
    queryFn: async () => {
      const { data } = await api.get<Paginated<HeadquartersInfo>>('/headquarters-info', {
        params: { page: 1, pageSize: 1 },
      })
      return data
    },
  })

  useEffect(() => {
    const first = existing.data?.items[0]
    if (first) {
      toast.error(t('headquartersInfo.onlyOneAllowed'))
      navigate(`/headquarters/info/${first.id}`, { replace: true })
    }
  }, [existing.data, navigate, t])

  if (existing.isLoading || (existing.data?.total ?? 0) > 0) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersInfo.create')}
        subtitle={t('headquartersInfo.createSubtitle')}
      />
      <HeadquartersInfoForm
        onSubmit={async (payload) => {
          const { data } = await api.post<{ id: string }>('/headquarters-info', payload)
          await invalidateBranding()
          toast.success(t('headquartersInfo.created'))
          navigate(`/headquarters/info/${data.id}`)
        }}
      />
    </div>
  )
}
