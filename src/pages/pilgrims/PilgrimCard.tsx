import {
  CalendarDays,
  IdCard,
  MapPin,
  Phone,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { forwardRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getImageUrl } from '../../lib/api'
import { formatDate, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { ManagedUser } from '../../types/app'

export type PilgrimCardModel = 'pocket' | 'classic'

const modelClass: Record<PilgrimCardModel, string> = {
  pocket: 'pilgrim-id-card pilgrim-id-card--pocket',
  classic: 'pilgrim-id-card pilgrim-id-card--classic',
}

export const PilgrimCard = forwardRef<
  HTMLDivElement,
  { pilgrim: ManagedUser; model?: PilgrimCardModel }
>(function PilgrimCard({ pilgrim, model = 'pocket' }, ref) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const place = [pilgrim.city, pilgrim.province, pilgrim.country]
    .filter(Boolean)
    .map((item) => geoName(item!))
    .join(' · ')
  const photoUrl = pilgrim.photoId ? getImageUrl(pilgrim.photoId) : null
  const genderLabel = pilgrim.gender ? t(`userGenders.${pilgrim.gender}`) : null

  return (
    <div ref={ref} className={modelClass[model]} dir="rtl">
      <div className="pilgrim-id-card__header">
        <div className="pilgrim-id-card__header-pattern" aria-hidden />
        <div className="pilgrim-id-card__brand">
          <p className="pilgrim-id-card__app">{t('app.name')}</p>
          <h2 className="pilgrim-id-card__title">{t('pilgrims.cardTitle')}</h2>
        </div>
        <div className="pilgrim-id-card__badge-wrap">
          <span className="pilgrim-id-card__seal" aria-hidden />
          <p className="pilgrim-id-card__badge">{t('pilgrims.cardShrine')}</p>
        </div>
      </div>
      <div className="pilgrim-id-card__gold" />
      <div className="pilgrim-id-card__body">
        <div className="pilgrim-id-card__identity">
          <div className="pilgrim-id-card__photo-wrap">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="pilgrim-id-card__photo"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="pilgrim-id-card__photo-fallback" aria-hidden>
                {initials(pilgrim.firstName, pilgrim.lastName)}
              </div>
            )}
          </div>
          <div className="pilgrim-id-card__name-block">
            <p className="pilgrim-id-card__name">{pilgrim.fullName}</p>
            {genderLabel ? (
              <p className="pilgrim-id-card__gender">
                <UserRound className="pilgrim-id-card__gender-icon" aria-hidden />
                {genderLabel}
              </p>
            ) : null}
          </div>
        </div>
        <div className="pilgrim-id-card__facts">
          <CardFact
            icon={IdCard}
            label={t('users.nationalId')}
            value={
              pilgrim.nationalId ? localizeDigits(pilgrim.nationalId, locale) : '—'
            }
            dir="ltr"
          />
          {pilgrim.birthDate ? (
            <CardFact
              icon={CalendarDays}
              label={t('pilgrims.birthDate')}
              value={formatDate(pilgrim.birthDate, locale)}
              dir="ltr"
            />
          ) : null}
          {pilgrim.phone ? (
            <CardFact
              icon={Phone}
              label={t('users.phone')}
              value={localizeDigits(pilgrim.phone, locale)}
              dir="ltr"
            />
          ) : null}
          {place ? <CardFact icon={MapPin} label={t('geo.city')} value={place} wide /> : null}
        </div>
      </div>
      <div className="pilgrim-id-card__footer">
        <span className="pilgrim-id-card__footer-dot" aria-hidden />
        <span>{t('pilgrims.cardFooter')}</span>
        <span className="pilgrim-id-card__footer-dot" aria-hidden />
      </div>
    </div>
  )
})

function CardFact({
  icon: Icon,
  label,
  value,
  dir,
  wide,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  dir?: 'ltr' | 'rtl'
  wide?: boolean
}) {
  return (
    <div className={`pilgrim-id-card__fact${wide ? ' pilgrim-id-card__fact--wide' : ''}`}>
      <span className="pilgrim-id-card__fact-icon">
        <Icon aria-hidden />
      </span>
      <div className="pilgrim-id-card__fact-text">
        <p className="pilgrim-id-card__fact-label">{label}</p>
        <p className="pilgrim-id-card__fact-value" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  )
}

function initials(firstName: string, lastName: string) {
  const a = firstName.trim().charAt(0)
  const b = lastName.trim().charAt(0)
  return `${a}${b}` || 'ز'
}
