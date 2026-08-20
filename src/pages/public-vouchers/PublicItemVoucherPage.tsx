import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import type { ItemQuotaVoucher } from '../../types/app'
import { VoucherShareButton } from '../../components/voucher/VoucherShareButton'
import { VoucherCard } from '../item-quota-vouchers/VoucherCard'
import { useVoucherCardImage } from '../../hooks/useVoucherCardImage'
import {
  PublicVoucherLayout,
  PublicVoucherLoading,
  PublicVoucherNotFound,
} from './PublicVoucherLayout'

export function PublicItemVoucherPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const query = useQuery({
    queryKey: ['public', 'item-voucher', code],
    enabled: Boolean(code),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<ItemQuotaVoucher>(
        `/public/vouchers/item/${encodeURIComponent(code ?? '')}`,
      )
      return data
    },
  })
  const voucher = query.data
  const { cardRef, qrUrl, downloading, sharing, shareUrl, shareText, downloadCard, shareCard } = useVoucherCardImage('item', voucher?.code, {
    downloaded: t('itemQuotaVouchers.cardDownloaded'),
    failed: t('itemQuotaVouchers.downloadFailed'),
  })

  if (query.isLoading) {
    return <PublicVoucherLoading />
  }
  if (!voucher) {
    return <PublicVoucherNotFound />
  }

  return (
    <PublicVoucherLayout
      title={t('itemQuotaVouchers.details')}
      subtitle={t('itemQuotaVouchers.detailsSubtitle')}
    >
      <VoucherCard ref={cardRef} voucher={voucher} qrUrl={qrUrl} />
      <VoucherShareButton
        onShare={shareCard}
        onDownload={() => downloadCard({ silent: true })}
        shareUrl={shareUrl}
        shareText={shareText}
        sharing={sharing}
        downloading={downloading}
        disabled={!qrUrl}
      />
    </PublicVoucherLayout>
  )
}
