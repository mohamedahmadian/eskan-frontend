import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingState, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { IceVoucher, IceVoucherAccommodationOption } from '../../types/app'
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

export function IceVoucherEditPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()

  const item = useQuery({
    queryKey: ['ice-voucher', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<IceVoucher>(`/ice-vouchers/${id}`)
      return data
    },
  })
  const accommodations = useQuery({
    queryKey: ['ice-vouchers', 'accommodations'],
    queryFn: async () => {
      const { data } = await api.get<IceVoucherAccommodationOption[]>(
        '/ice-vouchers/accommodations',
      )
      return data
    },
  })

  if (!item.data || !accommodations.data || !id) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader title={t('iceVouchers.edit')} subtitle={t('iceVouchers.editSubtitle')} />
      <IceVoucherRequestForm
        accommodations={accommodations.data}
        initial={item.data}
        onSubmit={async (payload) => {
          await api.patch(`/ice-vouchers/${id}`, payload)
          toast.success(t('iceVouchers.updated'))
          navigate(`/logistics/ice-vouchers/${id}`)
        }}
      />
    </div>
  )
}

export function MyIceVoucherCreatePage() {
  return <IceVoucherCreatePage basePath="/logistics/my-ice-vouchers" />
}
