import { IdCard, MapPin, Phone, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormCardHeaderDecor, FormMetaChip } from '../../components/ui/FormLayout'
import { getImageUrl } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { formatRoles } from '../../lib/roles'
import type { ManagedUser } from '../../types/app'

export function RoleUserProfileHeader({
  user,
  hideRoles,
}: {
  user: ManagedUser
  hideRoles?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const cityLabel = user.city ? geoName(user.city) : ''
  const rolesLabel = formatRoles(user.roles, t)
  const isActive = user.status === 'ACTIVE'

  return (
    <header className="relative overflow-hidden bg-gradient-to-e from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
      <FormCardHeaderDecor />
      <div className="relative flex items-start gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-ink-900">{user.fullName}</h2>
            <StatusBadge active={isActive} />
          </div>
          <p className="mt-1 text-xs leading-6 text-ink-600">
            @{localizeDigits(user.username, locale)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.nationalId ? (
              <FormMetaChip icon={IdCard} copyValue={user.nationalId} />
            ) : null}
            {user.phone ? (
              <FormMetaChip icon={Phone} copyValue={user.phone} />
            ) : null}
            {cityLabel ? <FormMetaChip icon={MapPin} label={cityLabel} /> : null}
            {!hideRoles && rolesLabel ? (
              <FormMetaChip icon={Shield} label={rolesLabel} />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

function UserAvatar({ user }: { user: ManagedUser }) {
  if (user.photoId) {
    return (
      <img
        src={getImageUrl(user.photoId)}
        alt=""
        className="size-12 shrink-0 rounded-2xl object-cover shadow-[0_10px_22px_rgba(46,189,182,0.32)] ring-2 ring-white"
      />
    )
  }
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-sm font-bold text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
      {personInitials(user.firstName, user.lastName)}
    </span>
  )
}

function personInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}` || '؟'
}

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
        active
          ? 'bg-teal-500 text-white ring-teal-500'
          : 'bg-white/80 text-ink-500 ring-line'
      }`}
    >
      {active ? t('userStatuses.ACTIVE') : t('userStatuses.INACTIVE')}
    </span>
  )
}
