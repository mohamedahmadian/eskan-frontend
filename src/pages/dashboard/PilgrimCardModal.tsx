import { Download, IdCard, Sparkles, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toPng } from 'html-to-image'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button, LoadingState, cardClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser } from '../../types/app'
import { PilgrimCard, type PilgrimCardModel } from '../pilgrims/PilgrimCard'

const pngOptions = {
  pixelRatio: 3,
  backgroundColor: '#ffffff',
  cacheBust: true,
}

export function PilgrimCardModal({
  onClose,
  variant = 'pilgrim',
}: {
  onClose: () => void
  variant?: 'pilgrim' | 'manager'
}) {
  const { t } = useTranslation()
  const [model, setModel] = useState<PilgrimCardModel>('pocket')
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const query = useQuery({
    queryKey: ['account', 'pilgrim-card'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>('/account')
      return data
    },
  })

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const pilgrim = query.data

  async function downloadCard() {
    if (!cardRef.current || !pilgrim) return
    setDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, pngOptions)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `pilgrim-card-${model}-${pilgrim.nationalId || pilgrim.id}.png`
      link.click()
      toast.success(t('pilgrims.cardDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('pilgrims.cardDownloadFailed')))
    } finally {
      setDownloading(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pilgrim-card-modal-title"
        className={`relative z-10 flex max-h-[min(92vh,100%)] w-full max-w-xl flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <h2 id="pilgrim-card-modal-title" className="text-base font-semibold text-ink-900">
            {t(variant === 'manager' ? 'dashboard.quickManagerCard' : 'dashboard.quickPilgrimCard')}
          </h2>
          <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('common.close')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {query.isLoading ? (
            <LoadingState />
          ) : query.isError || !pilgrim ? (
            <p className="text-sm text-ink-700">{t('common.error')}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setModel('pocket')}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    model === 'pocket'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
                  }`}
                >
                  <IdCard className="size-4" aria-hidden />
                  {t('pilgrims.cardModelPocket')}
                </button>
                <button
                  type="button"
                  onClick={() => setModel('classic')}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                    model === 'classic'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
                  }`}
                >
                  <Sparkles className="size-4" aria-hidden />
                  {t('pilgrims.cardModelClassic')}
                </button>
              </div>

              <div className="overflow-x-auto rounded-[28px] border border-line bg-cream-50 p-4 sm:p-6">
                <div className="mx-auto w-fit">
                  <PilgrimCard ref={cardRef} pilgrim={pilgrim} model={model} variant={variant} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-line px-4 py-3 sm:px-5">
          <Button
            type="button"
            onClick={() => void downloadCard()}
            disabled={downloading || !pilgrim}
          >
            <Download className="size-4" aria-hidden />
            {downloading ? t('pilgrims.cardDownloading') : t('pilgrims.downloadCard')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
