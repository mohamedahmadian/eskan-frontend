import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { IceVoucherAccommodationOption } from '../../types/app'
import { IceVoucherRequestForm } from './IceVoucherRequestForm'

export function IceVoucherCreatePage({
  basePath,
}: {
  basePath: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const accommodations = useQuery({
    queryKey: ['ice-vouchers', 'accommodations'],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherAccommodationOption[]>(
        '/ice-vouchers/accommodations',
      )
      return data
    },
  })

  if (!accommodations.data) {
    return <LoadingState />
  }

  if (!accommodations.data.length) {
    return (
      <div className={formShellClassName}>
        <PageHeader title={t('iceVouchers.create')} subtitle={t('iceVouchers.createSubtitle')} />
        <p className={`${cardClassName} px-5 py-4 text-sm text-ink-500`}>
          {t('iceVouchers.noAccommodation')}
        </p>
      </div>
    )
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('iceVouchers.create')} subtitle={t('iceVouchers.createSubtitle')} />
      <IceVoucherRequestForm
        accommodations={accommodations.data}
        onSubmit={async (payload) => {
          const { data } = await api.post<{ id: string }>('/ice-vouchers/mine', payload)
          toast.success(t('iceVouchers.created'))
          navigate(`${basePath}/${data.id}`)
        }}
      />
    </div>
  )
}

export function MyIceVoucherCreatePage() {
  return <IceVoucherCreatePage basePath="/logistics/my-ice-vouchers" />
}
