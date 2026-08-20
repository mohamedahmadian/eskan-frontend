import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import type { IceVoucher } from '../../types/app'
import { VoucherShareButton } from '../../components/voucher/VoucherShareButton'
import { IceVoucherCard } from '../ice-vouchers/IceVoucherCard'
import { useVoucherCardImage } from '../../hooks/useVoucherCardImage'
import {
  PublicVoucherLayout,
  PublicVoucherLoading,
  PublicVoucherNotFound,
} from './PublicVoucherLayout'

export function PublicIceVoucherPage() {
  const { t } = useTranslation()
  const { code } = useParams()
  const query = useQuery({
    queryKey: ['public', 'ice-voucher', code],
    enabled: Boolean(code),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<IceVoucher>(
        `/public/vouchers/ice/${encodeURIComponent(code ?? '')}`,
      )
      return data
    },
  })
  const voucher = query.data
  const { cardRef, qrUrl, downloading, sharing, shareUrl, shareText, downloadCard, shareCard } = useVoucherCardImage('ice', voucher?.code, {
    downloaded: t('iceVouchers.cardDownloaded'),
    failed: t('iceVouchers.downloadFailed'),
  })

  if (query.isLoading) {
    return <PublicVoucherLoading />
  }
  if (!voucher) {
    return <PublicVoucherNotFound />
  }

  return (
    <PublicVoucherLayout
      title={t('iceVouchers.details')}
      subtitle={t('iceVouchers.detailsSubtitle')}
    >
      <IceVoucherCard ref={cardRef} voucher={voucher} qrUrl={qrUrl} />
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
