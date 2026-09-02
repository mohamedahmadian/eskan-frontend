import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Building2, Send, X } from 'lucide-react'
import { Button } from '../../components/ui/Form'
import { FormCard, FormEmptyHint } from '../../components/ui/FormLayout'
import { languageDir } from '../../i18n'
import { localizeDigits } from '../../lib/datetime'
import type { RestaurantMealPlanDistribution } from '../../types/app'
import { distributionManagers } from './mealPlanDistributionSms'

type RecipientRow = {
  key: string
  accommodationName: string
  managerName: string
  phone: string | null
}

function recipientRows(items: RestaurantMealPlanDistribution[]): RecipientRow[] {
  return items.flatMap((item) => {
    const managers = distributionManagers(item)
    if (!managers.length) {
      return [
        {
          key: item.id,
          accommodationName: item.accommodation.name,
          managerName: '—',
          phone: null,
        },
      ]
    }
    return managers.map((manager) => ({
      key: `${item.id}-${manager.id}`,
      accommodationName: item.accommodation.name,
      managerName: manager.user?.fullName ?? '—',
      phone: manager.user?.phone?.trim() || null,
    }))
  })
}

export function MealPlanDistributionSmsAllModal({
  locale,
  items,
  sending,
  onClose,
  onSend,
}: {
  locale: string
  items: RestaurantMealPlanDistribution[]
  sending: boolean
  onClose: () => void
  onSend: () => Promise<void>
}) {
  const { t } = useTranslation()
  const rows = recipientRows(items)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div dir={languageDir(locale)} role="dialog" aria-modal="true" className="relative z-10 w-full max-w-2xl">
        <FormCard
          icon={Building2}
          title={t('restaurantMealPlans.smsAllTitle')}
          action={
            <Button type="button" variant="ghost" icon onClick={onClose} aria-label={t('common.close')}>
              <X className="size-4" aria-hidden />
            </Button>
          }
        >
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5 sm:p-6">
            {rows.length ? (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.accommodation')}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.managerName')}
                      </th>
                      <th className="px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.managerPhone')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key} className="border-t border-line">
                        <td className="px-3 py-2">{row.accommodationName}</td>
                        <td className="px-3 py-2">{row.managerName}</td>
                        <td className="px-3 py-2" dir="ltr">
                          {row.phone ? localizeDigits(row.phone, locale) : t('sms.noPhone')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <FormEmptyHint>{t('restaurantMealPlans.emptyDistributions')}</FormEmptyHint>
            )}
            <Button type="button" disabled={sending} onClick={() => void onSend()}>
              <Send className="size-4" aria-hidden />
              {t('sms.send')}
            </Button>
          </div>
        </FormCard>
      </div>
    </div>,
    document.body,
  )
}
