import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cardClassName } from '../../components/ui/Form'
import { FormCardHeaderDecor } from '../../components/ui/FormLayout'

export function LandingPageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  action,
  chips,
  children,
}: {
  icon: LucideIcon
  eyebrow?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  chips?: ReactNode
  children?: ReactNode
}) {
  return (
    <section className={`${cardClassName} overflow-hidden`}>
      <header className="relative overflow-hidden bg-gradient-to-e from-mint-50 via-white to-teal-50 px-5 py-6 sm:px-8 sm:py-7">
        <FormCardHeaderDecor />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="text-xs font-medium text-teal-700">{eyebrow}</p>
              ) : null}
              <h1
                className={`text-xl font-semibold leading-snug text-ink-900 sm:text-2xl ${eyebrow ? 'mt-1' : ''}`}
              >
                {title}
              </h1>
              {subtitle ? (
                <div className="mt-2 text-sm leading-7 text-ink-600">{subtitle}</div>
              ) : null}
              {chips ? <div className="mt-3 flex flex-wrap gap-1.5">{chips}</div> : null}
              {children}
            </div>
          </div>
          {action ? <div className="relative z-10 shrink-0">{action}</div> : null}
        </div>
      </header>
    </section>
  )
}
