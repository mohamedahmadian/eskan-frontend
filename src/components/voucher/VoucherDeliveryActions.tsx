import { Download, Store, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, cardClassName } from '../ui/Form'
import { VoucherShareButton } from './VoucherShareButton'
import type { ShareCardResult } from '../../lib/voucher-share'

export function VoucherDeliveryActions({
  onDownload,
  onSmsSupplier,
  onSmsManager,
  onShare,
  onShareDownload,
  shareUrl,
  shareText,
  sharing,
  downloading,
  disabled,
}: {
  onDownload: () => void
  onSmsSupplier?: () => void
  onSmsManager?: () => void
  onShare: () => Promise<ShareCardResult>
  onShareDownload: () => boolean | void | Promise<boolean | void>
  shareUrl: string
  shareText: string
  sharing: boolean
  downloading: boolean
  disabled: boolean
}) {
  const { t } = useTranslation()

  return (
    <section className={`mt-4 p-4 ${cardClassName}`}>
      <h2 className="mb-3 text-sm font-medium text-ink-700">{t('itemQuotaVouchers.deliveryActions')}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="soft"
          className="w-full"
          onClick={onDownload}
          disabled={disabled || downloading || sharing}
        >
          <Download className="size-4 shrink-0" aria-hidden />
          {t('itemQuotaVouchers.downloadCard')}
        </Button>
        <VoucherShareButton
          inline
          onShare={onShare}
          onDownload={onShareDownload}
          shareUrl={shareUrl}
          shareText={shareText}
          sharing={sharing}
          downloading={downloading}
          disabled={disabled || downloading}
        />
        {onSmsSupplier ? (
          <Button type="button" variant="ghost" className="w-full" onClick={onSmsSupplier}>
            <Store className="size-4 shrink-0" aria-hidden />
            {t('itemQuotaVouchers.sendSms')}
          </Button>
        ) : null}
        {onSmsManager ? (
          <Button type="button" variant="ghost" className="w-full" onClick={onSmsManager}>
            <UserRound className="size-4 shrink-0" aria-hidden />
            {t('itemQuotaVouchers.sendSmsToManager')}
          </Button>
        ) : null}
      </div>
    </section>
  )
}
