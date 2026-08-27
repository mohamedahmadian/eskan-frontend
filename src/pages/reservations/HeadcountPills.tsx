import { Mars, Users, Venus } from 'lucide-react'
import { reservationTypes, type ReservationType } from '../../types/app'

export function HeadcountPills({
  type,
  male,
  female,
  total,
  format,
  maleLabel,
  femaleLabel,
  totalLabel,
  showTotal: showTotalProp,
}: {
  type: ReservationType
  male: number
  female: number
  total: number
  format: (value: number) => string
  maleLabel: string
  femaleLabel: string
  totalLabel: string
  showTotal?: boolean
}) {
  const individual = type === reservationTypes.INDIVIDUAL
  const showMale = !individual || male >= 1
  const showFemale = !individual || male < 1
  const showTotal = showTotalProp ?? !individual

  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {showMale ? (
        <span
          className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-sky-50 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-sky-700"
          title={maleLabel}
        >
          <Mars className="size-3 shrink-0" aria-hidden />
          <span>{format(male)}</span>
          <span>{maleLabel}</span>
        </span>
      ) : null}
      {showFemale ? (
        <span
          className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-rose-700"
          title={femaleLabel}
        >
          <Venus className="size-3 shrink-0" aria-hidden />
          <span>{format(female)}</span>
          <span>{femaleLabel}</span>
        </span>
      ) : null}
      {showTotal ? (
        <span
          className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-teal-50 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-teal-800"
          title={totalLabel}
        >
          <Users className="size-3 shrink-0" aria-hidden />
          <span>{format(total)}</span>
          <span>{totalLabel}</span>
        </span>
      ) : null}
    </div>
  )
}
