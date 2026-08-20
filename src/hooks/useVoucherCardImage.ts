import { useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { toDataURL } from 'qrcode'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { publicVoucherUrl, type PublicVoucherKind } from '../lib/voucher-links'
import { type ShareCardResult } from '../lib/voucher-share'

export function useVoucherCardImage(
  kind: PublicVoucherKind,
  code: string | undefined,
  messages: { downloaded: string; failed: string },
) {
  const { t } = useTranslation()
  const cardRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<File | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)

  const shareUrl = code ? publicVoucherUrl(kind, code) : ''
  const shareTitle = kind === 'ice' ? t('iceVouchers.cardTitle') : t('itemQuotaVouchers.cardTitle')
  const shareText = code ? t('common.shareVoucherText', { code }) : ''

  useEffect(() => {
    if (!code) {
      setQrUrl(null)
      return
    }
    let cancelled = false
    toDataURL(publicVoucherUrl(kind, code), {
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
  }, [kind, code])

  useEffect(() => {
    fileRef.current = null
    if (!qrUrl || !code) return
    let cancelled = false
    const timer = window.setTimeout(() => {
      if (!cardRef.current) return
      void toPng(cardRef.current, pngOptions)
        .then((dataUrl) => {
          if (!cancelled) fileRef.current = dataUrlToFile(dataUrl, `${code}.png`)
        })
        .catch(() => {
          if (!cancelled) fileRef.current = null
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [qrUrl, code])

  async function capturePng() {
    if (!cardRef.current || !code) return null
    return toPng(cardRef.current, pngOptions)
  }

  async function getCardFile() {
    if (!code) return null
    if (fileRef.current) return fileRef.current
    const dataUrl = await capturePng()
    if (!dataUrl) return null
    const file = dataUrlToFile(dataUrl, `${code}.png`)
    fileRef.current = file
    return file
  }

  async function downloadCard(options?: { silent?: boolean }) {
    if (!code) return false
    setDownloading(true)
    try {
      const dataUrl = fileRef.current
        ? await fileToDataUrl(fileRef.current)
        : await capturePng()
      if (!dataUrl) return false
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `${code}.png`
      link.click()
      if (!options?.silent) toast.success(messages.downloaded)
      return true
    } catch {
      toast.error(messages.failed)
      return false
    } finally {
      setDownloading(false)
    }
  }

  async function shareCard(): Promise<ShareCardResult> {
    if (!code || typeof navigator.share !== 'function') return 'unavailable'
    setSharing(true)
    try {
      const file = await getCardFile()
      if (!file) return 'failed'
      await shareVoucherImage(file, shareTitle, shareText, shareUrl)
      return 'shared'
    } catch (error) {
      if (isAbortError(error)) return 'cancelled'
      return 'failed'
    } finally {
      setSharing(false)
    }
  }

  return {
    cardRef,
    qrUrl,
    downloading,
    sharing,
    shareUrl,
    shareText,
    downloadCard,
    shareCard,
  }
}

const pngOptions = {
  pixelRatio: 2,
  backgroundColor: '#ffffff',
  cacheBust: true,
}

function dataUrlToFile(dataUrl: string, filename: string) {
  const [meta, base64] = dataUrl.split(',')
  const mime = /data:(.*?);/.exec(meta)?.[1] ?? 'image/png'
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
  return new File([bytes], filename, { type: mime })
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function shareVoucherImage(file: File, title: string, text: string, url: string) {
  const withFile = { files: [file], title, text }
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share(withFile)
    return
  }
  try {
    await navigator.share(withFile)
  } catch (error) {
    if (isAbortError(error)) throw error
    await navigator.share({ title, text, url })
  }
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
