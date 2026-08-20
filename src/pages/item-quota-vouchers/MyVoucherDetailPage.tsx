import { Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { Button, LoadingState, PageHeader, userFormShellClassName } from '../../components/ui/Form'
import { VoucherShareButton } from '../../components/voucher/VoucherShareButton'
import { useVoucherCardImage } from '../../hooks/useVoucherCardImage'
import { api } from '../../lib/api'
import type { ItemQuotaVoucher } from '../../types/app'
import { VoucherCard } from './VoucherCard'

export function MyVoucherDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()

  const query = useQuery({
    queryKey: ['item-quota-vouchers', 'mine', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ItemQuotaVoucher>(`/item-quota-vouchers/mine/${id}`)
      return data
    },
  })

  const item = query.data
  const { cardRef, qrUrl, downloading, sharing, shareUrl, shareText, downloadCard, shareCard } = useVoucherCardImage('item', item?.code, {
    downloaded: t('itemQuotaVouchers.cardDownloaded'),
    failed: t('itemQuotaVouchers.downloadFailed'),
  })

  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('itemQuotaVouchers.details')}
        subtitle={t('myVouchers.detailsSubtitle')}
        action={
          <Link to="/logistics/my-vouchers" className="text-sm text-teal-700 hover:underline">
            {t('myVouchers.backToList')}
          </Link>
        }
      />
      <VoucherCard ref={cardRef} voucher={item} qrUrl={qrUrl} />
      <div className="mt-6">
        <Button type="button" variant="ghost" onClick={() => void downloadCard()} disabled={downloading || sharing || !qrUrl}>
          <Download className="size-4" aria-hidden />
          {t('itemQuotaVouchers.downloadCard')}
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
