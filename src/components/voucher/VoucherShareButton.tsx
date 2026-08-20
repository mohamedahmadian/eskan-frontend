import { Link2, MessageCircle, Send, Share2, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  canUseNativeShare,
  copyText,
  eitaaShareUrl,
  openExternalShare,
  telegramShareUrl,
  type ShareCardResult,
} from '../../lib/voucher-share'
import { Button } from '../ui/Form'

export function VoucherShareButton({
  onShare,
  onDownload,
  shareUrl,
  shareText,
  sharing,
  downloading,
  disabled,
  inline = false,
}: {
  onShare: () => Promise<ShareCardResult>
  onDownload: () => boolean | void | Promise<boolean | void>
  shareUrl: string
  shareText: string
  sharing: boolean
  downloading?: boolean
  disabled?: boolean
  inline?: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const busy = sharing || Boolean(downloading)

  async function handleShareImage() {
    const result = await onShare()
    if (result === 'shared' || result === 'cancelled') {
      setOpen(false)
      return
    }
    const saved = await onDownload()
    if (saved !== false) toast.success(t('common.shareImageSaved'))
  }

  const trigger = (
    <Button
      type="button"
      variant={inline ? 'ghost' : 'primary'}
      className="w-full"
      onClick={() => setOpen(true)}
      disabled={disabled || busy}
    >
      <Share2 className="size-4" aria-hidden />
      {t('common.shareCard')}
    </Button>
  )

  return (
    <>
      {inline ? (
        trigger
      ) : (
        <>
          <div className="h-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:hidden" aria-hidden />
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-cream-50/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
            <div className="mx-auto w-full max-w-3xl">{trigger}</div>
          </div>
        </>
      )}
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/30"
            aria-label={t('common.cancel')}
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="voucher-share-title"
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] border border-line bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_40px_rgba(15,110,106,0.08)] lg:inset-auto lg:left-1/2 lg:top-1/2 lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[28px] lg:pb-4 lg:shadow-[0_18px_40px_rgba(15,110,106,0.12)]"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line lg:hidden" />
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="voucher-share-title" className="text-base font-semibold text-ink-900">
                {t('common.shareCard')}
              </h2>
              <Button type="button" variant="ghost" icon onClick={() => setOpen(false)} aria-label={t('common.cancel')}>
                <X className="size-4" aria-hidden />
              </Button>
            </div>
            <div className="mx-auto grid max-w-3xl gap-2">
              <ShareOption
                icon={Share2}
                label={sharing ? t('common.sharingCard') : t('common.shareImage')}
                disabled={busy || disabled}
                onClick={() => void handleShareImage()}
              />
              <ShareOption
                icon={Send}
                label={t('common.shareViaEitaa')}
                disabled={!shareUrl}
                onClick={() => {
                  openExternalShare(eitaaShareUrl(shareUrl))
                  setOpen(false)
                }}
              />
              <ShareOption
                icon={MessageCircle}
                label={t('common.shareViaTelegram')}
                disabled={!shareUrl}
                onClick={() => {
                  openExternalShare(telegramShareUrl(shareUrl, shareText))
                  setOpen(false)
                }}
              />
              <ShareOption
                icon={Link2}
                label={t('common.copyLink')}
                disabled={!shareUrl}
                onClick={() => {
                  void copyText(shareUrl).then(() => {
                    toast.success(t('common.linkCopied'))
                    setOpen(false)
                  })
                }}
              />
            </div>
            {canUseNativeShare() ? null : (
              <p className="mx-auto mt-3 max-w-3xl text-xs text-ink-400">{t('common.shareImageHint')}</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

function ShareOption({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Share2
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center gap-3 rounded-2xl bg-cream-50 px-3.5 py-3 text-start text-sm font-medium text-ink-900 transition hover:bg-cream-100 disabled:opacity-60"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-teal-600">
        <Icon className="size-4" aria-hidden />
      </span>
      {label}
    </button>
  )
}
