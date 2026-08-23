import { Download, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import type { IceVoucher } from '../../types/app'
import { VoucherShareButton } from '../../components/voucher/VoucherShareButton'
import { IceVoucherCard } from './IceVoucherCard'
import { useVoucherCardImage } from '../../hooks/useVoucherCardImage'

export function MyIceVoucherDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()

  const query = useQuery({
    queryKey: ['ice-vouchers', 'mine', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<IceVoucher>(`/ice-vouchers/mine/${id}`)
      return data
    },
  })

  const item = query.data
  const { cardRef, qrUrl, downloading, sharing, shareUrl, shareText, downloadCard, shareCard } = useVoucherCardImage('ice', item?.code, {
    downloaded: t('iceVouchers.cardDownloaded'),
    failed: t('iceVouchers.downloadFailed'),
  })

  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader title={t('iceVouchers.details')} subtitle={t('myIceVouchers.detailsSubtitle')} />
      <IceVoucherCard ref={cardRef} voucher={item} qrUrl={qrUrl} />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {item.status === 'PENDING' ? (
          <Button
            type="button"
            variant="danger"
            onClick={() =>
              confirmDelete({
                message: t('iceVouchers.confirmDelete'),
                successMessage: t('iceVouchers.deleted'),
                path: `/ice-vouchers/mine/${item.id}`,
                queryKey: ['ice-vouchers'],
                onDeleted: () => navigate('/logistics/my-ice-vouchers'),
              })
            }
          >
            <Trash2 className="size-4" aria-hidden />
            {t('iceVouchers.delete')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="soft"
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
