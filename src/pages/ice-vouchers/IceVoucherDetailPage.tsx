import { Check, Download, Trash2, X } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { confirmToast } from '../../components/ui/confirmToast'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getApiErrorMessage } from '../../lib/api'
import type { IceVoucher } from '../../types/app'
import { VoucherShareButton } from '../../components/voucher/VoucherShareButton'
import { IceVoucherCard } from './IceVoucherCard'
import { useVoucherCardImage } from '../../hooks/useVoucherCardImage'

export function IceVoucherDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['ice-voucher', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<IceVoucher>(`/ice-vouchers/${id}`)
      return data
    },
  })

  const item = query.data
  const { cardRef, qrUrl, downloading, sharing, shareUrl, shareText, downloadCard, shareCard } = useVoucherCardImage('ice', item?.code, {
    downloaded: t('iceVouchers.cardDownloaded'),
    failed: t('iceVouchers.downloadFailed'),
  })

  const decide = useMutation({
    mutationFn: async (action: 'approve' | 'reject') => {
      const { data } = await api.post<IceVoucher>(`/ice-vouchers/${id}/${action}`)
      return data
    },
    onSuccess: async (_data, action) => {
      await queryClient.invalidateQueries({ queryKey: ['ice-vouchers'] })
      await queryClient.invalidateQueries({ queryKey: ['ice-voucher', id] })
      toast.success(action === 'approve' ? t('iceVouchers.approved') : t('iceVouchers.rejected'))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('iceVouchers.details')}
        subtitle={t('iceVouchers.detailsSubtitle')}
        action={
          <Link to="/logistics/ice-vouchers" className="text-sm text-teal-700 hover:underline">
            {t('iceVouchers.backToList')}
          </Link>
        }
      />
      <IceVoucherCard ref={cardRef} voucher={item} qrUrl={qrUrl} />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-3">
          {item.status === 'PENDING' ? (
            <>
              <Button
                type="button"
                disabled={decide.isPending}
                onClick={() => decide.mutate('approve')}
              >
                <Check className="size-4" aria-hidden />
                {t('iceVouchers.approve')}
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={decide.isPending}
                onClick={() =>
                  confirmToast({
                    title: t('iceVouchers.confirmReject'),
                    confirmLabel: t('iceVouchers.reject'),
                    cancelLabel: t('iceVouchers.cancel'),
                    onConfirm: () => decide.mutate('reject'),
                  })
                }
              >
                <X className="size-4" aria-hidden />
                {t('iceVouchers.reject')}
              </Button>
            </>
          ) : null}
          {item.status !== 'APPROVED' ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                confirmDelete({
                  message: t('iceVouchers.confirmDelete'),
                  successMessage: t('iceVouchers.deleted'),
                  path: `/ice-vouchers/${item.id}`,
                  queryKey: ['ice-vouchers'],
                  onDeleted: () => navigate('/logistics/ice-vouchers'),
                })
              }
            >
              <Trash2 className="size-4" aria-hidden />
              {t('iceVouchers.delete')}
            </Button>
          ) : null}
        </div>
        <Button
          type="button"
          variant="gold"
          className="ms-auto"
          onClick={() => void downloadCard()}
          disabled={downloading || sharing || !qrUrl}
        >
          <Download className="size-4" aria-hidden />
          {t('iceVouchers.downloadCard')}
        </Button>
      </div>
      <VoucherShareButton
        onShare={shareCard}
        onDownload={() => downloadCard({ silent: true })}
        shareUrl={shareUrl}
        shareText={shareText}
        sharing={sharing}
        downloading={downloading}
        disabled={!qrUrl || downloading}
      />
    </div>
  )
}
