import { Download, IdCard, Sparkles, Printer } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  LoadingState,
  PageHeader,
  cardClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import { api, getApiErrorMessage } from '../../lib/api'
import type { ManagedUser } from '../../types/app'
import { PilgrimCard, type PilgrimCardModel } from './PilgrimCard'

const pngOptions = {
  pixelRatio: 3,
  backgroundColor: '#ffffff',
  cacheBust: true,
}

export function PilgrimCardPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const [model, setModel] = useState<PilgrimCardModel>('pocket')
  const [busy, setBusy] = useState<'download' | 'print' | null>(null)
  const pocketRef = useRef<HTMLDivElement>(null)
  const classicRef = useRef<HTMLDivElement>(null)

  const query = useQuery({
    queryKey: ['pilgrims', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`/pilgrims/${id}`)
      return data
    },
  })

  const pilgrim = query.data

  async function downloadCard() {
    setBusy('download')
    try {
      const node = model === 'classic' ? classicRef.current : pocketRef.current
      if (!node) return
      const dataUrl = await toPng(node, pngOptions)
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `pilgrim-card-${model}-${pilgrim?.nationalId || pilgrim?.id || 'card'}.png`
      link.click()
      toast.success(t('pilgrims.cardDownloaded'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('pilgrims.cardDownloadFailed')))
    } finally {
      setBusy(null)
    }
  }

  function printCard() {
    setBusy('print')
    document.body.classList.add(
      model === 'classic' ? 'pilgrim-print-classic' : 'pilgrim-print-pocket',
    )
    window.setTimeout(() => {
      window.print()
      document.body.classList.remove('pilgrim-print-pocket', 'pilgrim-print-classic')
      setBusy(null)
    }, 80)
  }

  if (!pilgrim) {
    return <LoadingState />
  }

  return (
    <div className={`${userFormShellClassName} pilgrim-card-page`}>
      <PageHeader title={t('pilgrims.card')} subtitle={t('pilgrims.cardSubtitle')} />

      <div className={`mb-4 flex flex-wrap gap-2 p-3 print:hidden ${cardClassName}`}>
        <button
          type="button"
          onClick={() => setModel('pocket')}
          className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
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
          className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition ${
            model === 'classic'
              ? 'bg-teal-500 text-white shadow-sm'
              : 'bg-cream-50 text-ink-700 hover:bg-cream-100'
          }`}
        >
          <Sparkles className="size-4" aria-hidden />
          {t('pilgrims.cardModelClassic')}
        </button>
      </div>

      <div className="pilgrim-card-preview overflow-x-auto rounded-[28px] border border-line bg-cream-50 p-4 sm:p-6 print:hidden">
        <div className="mx-auto w-fit">
          <PilgrimCard pilgrim={pilgrim} model={model} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 print:hidden">
        <Button type="button" onClick={() => void downloadCard()} disabled={busy !== null}>
          <Download className="size-4" aria-hidden />
          {busy === 'download' ? t('pilgrims.cardDownloading') : t('pilgrims.downloadCard')}
        </Button>
        <Button type="button" variant="ghost" onClick={printCard} disabled={busy !== null}>
          <Printer className="size-4" aria-hidden />
          {t('pilgrims.printCard')}
        </Button>
      </div>

      <div className="pilgrim-print-root" aria-hidden>
        <div className="pilgrim-print-pocket-target">
          <PilgrimCard ref={pocketRef} pilgrim={pilgrim} model="pocket" />
        </div>
        <div className="pilgrim-print-classic-target">
          <PilgrimCard ref={classicRef} pilgrim={pilgrim} model="classic" />
        </div>
      </div>
    </div>
  )
}
