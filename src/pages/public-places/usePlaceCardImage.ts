import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { toDataURL } from 'qrcode'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const pngOptions = {
  pixelRatio: 3,
  backgroundColor: '#ffffff',
  cacheBust: true,
}

export function usePlaceCardImage(
  shareUrl: string,
  filename: string,
  messages: { downloaded: string; failed: string },
) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!shareUrl) {
      setQrUrl(null)
      return
    }
    let cancelled = false
    toDataURL(shareUrl, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f6e6a', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelled) setQrUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [shareUrl])

  async function downloadCard() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, pngOptions)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = filename
      link.click()
      toast.success(messages.downloaded)
    } catch {
      toast.error(messages.failed || t('common.error'))
    } finally {
      setDownloading(false)
    }
  }

  return { cardRef, qrUrl, downloading, downloadCard }
}
