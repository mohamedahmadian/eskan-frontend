import { Mars, Venus } from 'lucide-react'
import type { Caravan } from '../../types/app'

export function caravanHeadcount(item: Caravan, year?: number) {
  const row = year == null ? undefined : item.years?.find((entry) => entry.year === year)
  return {
    male: row?.maleCount ?? item.maleCount ?? 0,
    female: row?.femaleCount ?? item.femaleCount ?? 0,
  }
}

export function CaravanGenderCount({
  kind,
  value,
  label,
  format,
}: {
  kind: 'male' | 'female'
  value: number
  label: string
  format: (value: number) => string
}) {
  const male = kind === 'male'
  const Icon = male ? Mars : Venus
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
        male ? 'bg-sky-50 text-sky-700' : 'bg-rose-50 text-rose-700'
      }`}
      title={label}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span>{format(value)}</span>
      <span>{label}</span>
    </span>
  )
}
