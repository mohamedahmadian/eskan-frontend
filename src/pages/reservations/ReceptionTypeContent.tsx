import { Check, Info, ScrollText, X, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Button, cardClassName } from '../../components/ui/Form'
import type { ReceptionSettings, ReservationType } from '../../types/app'

export function splitMultilineItems(text: string | null | undefined): string[] {
  if (!text?.trim()) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function settingsIntroKey(type: ReservationType) {
  if (type === 'INDIVIDUAL') return 'individualIntro' as const
  if (type === 'GROUP') return 'groupIntro' as const
  return 'caravanIntro' as const
}

export function settingsRulesKey(type: ReservationType) {
  if (type === 'INDIVIDUAL') return 'individualRules' as const
  if (type === 'GROUP') return 'groupRules' as const
  return 'caravanRules' as const
}

type ItemVariant = 'intro' | 'rules'

const variantStyles: Record<
  ItemVariant,
  { Icon: LucideIcon; iconWrap: string; item: string; title: string }
> = {
  intro: {
    Icon: Info,
    iconWrap: 'bg-teal-50 text-teal-600',
    item: 'border-teal-100/80 bg-gradient-to-e from-teal-50/70 to-white',
    title: 'text-teal-800',
  },
  rules: {
    Icon: Check,
    iconWrap: 'bg-mint-50 text-mint-600',
    item: 'border-line bg-cream-50/80',
    title: 'text-ink-800',
  },
}

export function ReceptionMultilineItems({
  text,
  variant,
  title,
  className = '',
}: {
  text: string
  variant: ItemVariant
  title?: string
  className?: string
}) {
  const lines = splitMultilineItems(text)
  if (!lines.length) return null
  const style = variantStyles[variant]
  const Icon = style.Icon

  return (
    <div className={className}>
      {title ? (
        <p className={`mb-2 text-xs font-semibold ${style.title}`}>{title}</p>
      ) : null}
      <ul className="space-y-2">
        {lines.map((line, index) => (
          <li
            key={`${index}-${line.slice(0, 24)}`}
            className={`flex items-start gap-2.5 rounded-2xl border px-3 py-2.5 text-sm leading-6 text-ink-700 shadow-[0_6px_16px_rgba(20,40,40,0.04)] ${style.item}`}
          >
            <span
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-xl ${style.iconWrap}`}
              aria-hidden
            >
              <Icon className="size-3.5" />
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Intro text from reception settings for the type selection cards. */
export function ReceptionTypeIntro({
  type,
  settings,
  className = '',
}: {
  type: ReservationType
  settings?: ReceptionSettings | null
  className?: string
}) {
  const intro = settings?.[settingsIntroKey(type)] ?? ''
  return (
    <ReceptionMultilineItems text={intro} variant="intro" className={className} />
  )
}

export function ReceptionRulesModal({
  type,
  settings,
  submitting,
  onClose,
  onConfirm,
}: {
  type: ReservationType
  settings?: ReceptionSettings | null
  submitting?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const { t } = useTranslation()
  const rules = settings?.[settingsRulesKey(type)] ?? ''

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, submitting])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose()
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reception-rules-title"
        className={`relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[28px] sm:rounded-[28px] ${cardClassName}`}
      >
        <header className="flex items-start gap-3 border-b border-line px-5 py-4 sm:px-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-50 text-mint-600">
            <ScrollText className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 id="reception-rules-title" className="text-lg font-semibold text-ink-900">
              {t('receptionSettings.rules')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              {t('reservations.rulesModalHint')}
            </p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {splitMultilineItems(rules).length > 0 ? (
            <ReceptionMultilineItems text={rules} variant="rules" />
          ) : (
            <p className="rounded-2xl border border-line bg-cream-50 px-4 py-3 text-sm leading-7 text-ink-600">
              {t('reservations.rulesEmpty')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line px-5 py-4 sm:px-6">
          <Button type="button" disabled={submitting} onClick={onConfirm}>
            <Check className="size-4" aria-hidden />
            {t('reservations.createAndSubmit')}
          </Button>
          <Button type="button" variant="ghost" disabled={submitting} onClick={onClose}>
            <X className="size-4" aria-hidden />
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
