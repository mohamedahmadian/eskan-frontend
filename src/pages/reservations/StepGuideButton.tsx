import { CircleHelp } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AppModal } from '../../components/ui/AppModal'
import { Button } from '../../components/ui/Form'
import { api } from '../../lib/api'
import type { ReceptionSettings, ReservationType } from '../../types/app'
import {
  reservationHelpKey,
  reservationHelpMedia,
  reservationHelpText,
} from './reservation-help'
import type { ReservationStepCode } from './reservation-steps'

export function StepGuideButton({
  step,
  reservationType,
  year,
}: {
  step: ReservationStepCode
  reservationType?: ReservationType
  year: number
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const helpKey = reservationHelpKey(step, reservationType)
  const settings = useQuery({
    queryKey: ['reception-settings', year],
    queryFn: async () => {
      const { data } = await api.get<ReceptionSettings>(`/reception-settings/${year}`)
      return data
    },
  })
  const title = t(`reservations.helpContent.${helpKey}.title`)
  const description = t(`reservations.helpContent.${helpKey}.description`)
  const body =
    reservationHelpText(settings.data, helpKey) ||
    t(`reservations.helpContent.${helpKey}.body`)
  const media = reservationHelpMedia[step]

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  return (
    <>
      <Button
        type="button"
        variant="primary"
        className="bg-teal-600 shadow-[0_8px_20px_rgba(13,148,136,0.38)] hover:bg-teal-700"
        onClick={() => setOpen(true)}
      >
        <CircleHelp className="size-4" aria-hidden />
        {t('reservations.help')}
      </Button>
      {open ? (
        <AppModal
          onClose={() => setOpen(false)}
          labelledBy="step-guide-title"
          zClassName="z-50"
          onEscape={() => {
            if (imageOpen) {
              setImageOpen(false)
              return false
            }
          }}
          className="flex max-h-[92vh] w-full flex-col rounded-t-[22px] border border-white bg-white p-5 shadow-[0_16px_40px_rgba(20,40,40,0.14)] sm:max-h-[85vh] sm:max-w-2xl sm:rounded-[22px]"
        >
            <div
              ref={panelRef}
              tabIndex={-1}
              className="mb-3 flex items-start justify-between gap-3 pe-12 outline-none"
            >
              <div>
                <h2 id="step-guide-title" className="text-base font-semibold text-ink-900">
                  {title}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{description}</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="whitespace-pre-wrap text-sm leading-7 text-ink-700">{body}</p>
              {media.image ? (
                <button
                  type="button"
                  className="block w-full overflow-hidden rounded-2xl"
                  onClick={() => setImageOpen(true)}
                >
                  <img src={media.image} alt="" className="h-auto w-full object-cover" />
                </button>
              ) : null}
              {media.videoUrl ? (
                <div className="overflow-hidden rounded-2xl bg-cream-50">
                  <video className="w-full" src={media.videoUrl} controls playsInline />
                </div>
              ) : null}
            </div>
        </AppModal>
      ) : null}
      {imageOpen && media.image ? (
        <AppModal
          onClose={() => setImageOpen(false)}
          ariaLabel={title}
          zClassName="z-[60]"
          overlayClassName="flex items-center justify-center p-4"
          backdropClassName="bg-ink-900/70"
          className="flex max-h-full max-w-full items-center justify-center pe-12"
        >
          <img src={media.image} alt="" className="max-h-full max-w-full rounded-2xl object-contain" />
        </AppModal>
      ) : null}
    </>
  )
}
