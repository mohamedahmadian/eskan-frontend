import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Flag,
  Footprints,
  IdCard,
  MapPin,
  Phone,
  ScrollText,
  Tent,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { toDataURL } from 'qrcode'
import { forwardRef, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { languageDir } from '../../i18n'
import { AppLogo } from '../../components/brand/AppLogo'
import { getImageUrl, api } from '../../lib/api'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { formatDate, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { publicProfileUrl } from '../../lib/public-profile'
import type { ManagedUser, PublicProfile, PublicProfileCurrentVisit } from '../../types/app'

export type PilgrimCardModel = 'pocket' | 'classic'

const modelClass: Record<PilgrimCardModel, string> = {
  pocket: 'pilgrim-id-card pilgrim-id-card--pocket',
  classic: 'pilgrim-id-card pilgrim-id-card--classic',
}

export const PilgrimCard = forwardRef<
  HTMLDivElement,
  { pilgrim: ManagedUser; model?: PilgrimCardModel; variant?: 'pilgrim' | 'manager' }
>(function PilgrimCard({ pilgrim, model = 'pocket', variant = 'pilgrim' }, ref) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const place = [pilgrim.city, pilgrim.province, pilgrim.country]
    .filter(Boolean)
    .map((item) => geoName(item!))
    .join(' · ')
  const photoUrl = pilgrim.photoId ? getImageUrl(pilgrim.photoId) : null
  const genderLabel = pilgrim.gender ? t(`userGenders.${pilgrim.gender}`) : null
  const profile = useQuery({
    queryKey: ['public', 'profile', pilgrim.id, 'card'],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<PublicProfile>(`/public/profiles/${pilgrim.id}`)
      return data
    },
  })
  const visit = profile.data?.currentVisit ?? null
  const hasFile = Boolean(visit?.file)
  const showPocketIdentity = model === 'pocket' && hasFile
  const originName = visit?.travel?.originCity ? geoName(visit.travel.originCity) : null
  const showTrip = hasTripFacts(visit, model, originName)
  const pocketTrip = model === 'pocket' && hasFile && showTrip
  const showCaravanFacts = Boolean(
    visit?.caravan &&
      (model === 'classic' || visit.file) &&
      (visit.file?.type === 'CARAVAN' || !visit.file),
  )
  const stayMapUrl = visit?.stay?.mapUrl || null
  const caravanLine =
    visit?.caravanName && !showCaravanFacts
      ? t('pilgrims.cardYearCaravan', { name: visit.caravanName })
      : null

  return (
    <div
      ref={ref}
      className={`${modelClass[model]}${showTrip ? ' pilgrim-id-card--trip' : ''}`}
      dir={languageDir(locale)}
    >
      <div className="pilgrim-id-card__header">
        <div className="pilgrim-id-card__header-pattern" aria-hidden />
        <div className="pilgrim-id-card__brand">
          <AppLogo className="pilgrim-id-card__logo" decorative />
          <h2 className="pilgrim-id-card__title">
            {t(variant === 'manager' ? 'pilgrims.managerCardTitle' : 'pilgrims.cardTitle')}
          </h2>
        </div>
        <div className="pilgrim-id-card__badge-wrap">
          <span className="pilgrim-id-card__seal" aria-hidden />
          <p className="pilgrim-id-card__badge">{t('pilgrims.cardShrine')}</p>
        </div>
      </div>
      <div className="pilgrim-id-card__gold" />
      <div className="pilgrim-id-card__body">
        <div className="pilgrim-id-card__main">
          <div
            className={`pilgrim-id-card__identity${
              showPocketIdentity ? ' pilgrim-id-card__identity--stacked' : ''
            }${pocketTrip ? ' pilgrim-id-card__identity--compact' : ''}`}
          >
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
              {showPocketIdentity && pilgrim.nationalId ? (
                <p className="pilgrim-id-card__meta">
                  <span className="pilgrim-id-card__meta-label">{t('users.nationalId')}</span>
                  <span className="pilgrim-id-card__meta-value">
                    <CopyableDigits value={pilgrim.nationalId} />
                  </span>
                </p>
              ) : null}
              {showPocketIdentity && pilgrim.phone ? (
                <p className="pilgrim-id-card__meta">
                  <span className="pilgrim-id-card__meta-label">{t('users.phone')}</span>
                  <span className="pilgrim-id-card__meta-value">
                    <CopyableDigits value={pilgrim.phone} />
                  </span>
                </p>
              ) : null}
            </div>
          </div>
          <div className={`pilgrim-id-card__facts${pocketTrip ? ' pilgrim-id-card__facts--trip' : ''}`}>
            {showPocketIdentity ? null : (
              <CardFact
                icon={IdCard}
                label={t('users.nationalId')}
                value={<CopyableDigits value={pilgrim.nationalId} />}
              />
            )}
            {pocketTrip || !pilgrim.birthDate ? null : (
              <CardFact
                icon={CalendarDays}
                label={t('pilgrims.birthDate')}
                value={formatDate(pilgrim.birthDate, locale)}
                dir="ltr"
              />
            )}
            {showPocketIdentity || !pilgrim.phone ? null : (
              <CardFact
                icon={Phone}
                label={t('users.phone')}
                value={<CopyableDigits value={pilgrim.phone} />}
              />
            )}
            {pocketTrip || !place ? null : (
              <CardFact icon={MapPin} label={t('geo.city')} value={place} wide />
            )}
            <TripFacts visit={visit} model={model} originName={originName} locale={locale} />
          </div>
          {caravanLine ? <p className="pilgrim-id-card__visit">{caravanLine}</p> : null}
        </div>
        {model === 'pocket' ? (
          <div className="pilgrim-id-card__codes">
            <CardBarcode profileUrl={publicProfileUrl(pilgrim.id)} stayMapUrl={stayMapUrl} />
          </div>
        ) : null}
      </div>
      {model === 'classic' ? (
        <div className="pilgrim-id-card__codes">
          <CardBarcode profileUrl={publicProfileUrl(pilgrim.id)} stayMapUrl={stayMapUrl} />
        </div>
      ) : null}
      <div className="pilgrim-id-card__footer">
        <span className="pilgrim-id-card__footer-dot" aria-hidden />
        <span>{t('pilgrims.cardFooter')}</span>
        <span className="pilgrim-id-card__footer-dot" aria-hidden />
      </div>
    </div>
  )
})

function CardBarcode({
  profileUrl,
  stayMapUrl,
}: {
  profileUrl: string
  stayMapUrl: string | null
}) {
  const { t } = useTranslation()
  if (stayMapUrl) return <CardQr value={stayMapUrl} label={t('pilgrims.cardStayQr')} />
  return <CardQr value={profileUrl} />
}

function hasTripFacts(
  visit: PublicProfileCurrentVisit | null,
  model: PilgrimCardModel,
  originName: string | null,
) {
  if (!visit) return false
  const type = visit.file?.type
  const showDetails = model === 'classic' || Boolean(visit.file)
  if (!showDetails) return false
  return Boolean(
    visit.file ||
      visit.caravan ||
      originName ||
      visit.travel?.departureDate ||
      visit.travel?.arrivalDate ||
      (visit.stay && (type === 'CARAVAN' || type === 'INDIVIDUAL' || type === 'GROUP' || model === 'classic')),
  )
}

function TripFacts({
  visit,
  model,
  originName,
  locale,
}: {
  visit: PublicProfileCurrentVisit | null
  model: PilgrimCardModel
  originName: string | null
  locale: string
}) {
  const { t } = useTranslation()
  if (!visit || !hasTripFacts(visit, model, originName)) return null
  const type = visit.file?.type
  const isCaravanFile = type === 'CARAVAN'
  const isPartyFile = type === 'INDIVIDUAL' || type === 'GROUP'
  const showCaravan = Boolean(visit.caravan && (isCaravanFile || !visit.file))
  const showStay = Boolean(visit.stay && (isCaravanFile || isPartyFile || model === 'classic'))

  return (
    <>
      <FactRow
        right={
          visit.file ? (
            <CardFact
              icon={ScrollText}
              label={t('pilgrims.cardFileCode')}
              value={localizeDigits(visit.file.code, locale)}
              dir="ltr"
              tone="file"
              inline
            />
          ) : null
        }
        left={
          isPartyFile && originName ? (
            <CardFact icon={Flag} label={t('pilgrims.cardOrigin')} value={originName} />
          ) : null
        }
      />
      {showCaravan && visit.caravan ? (
        <FactRow
          right={<CardFact icon={Tent} label={t('caravans.name')} value={visit.caravan.name} />}
          left={
            visit.caravan.managerName ? (
              <CardFact
                icon={UserRound}
                label={t('caravans.manager')}
                value={visit.caravan.managerName}
              />
            ) : null
          }
        />
      ) : null}
      {showCaravan && visit.caravan?.managerPhone ? (
        <FactRow
          single={
            <CardFact
              icon={Phone}
              label={t('pilgrims.cardManagerPhone')}
              value={<CopyableDigits value={visit.caravan.managerPhone} />}
              wide
            />
          }
        />
      ) : null}
      {isPartyFile ? (
        <FactRow
          right={
            visit.travel?.departureDate ? (
              <CardFact
                icon={Footprints}
                label={t('pilgrims.cardDeparture')}
                value={formatDate(visit.travel.departureDate, locale)}
                dir="ltr"
              />
            ) : null
          }
          left={
            visit.travel?.arrivalDate ? (
              <CardFact
                icon={CalendarCheck}
                label={t('pilgrims.cardArrival')}
                value={formatDate(visit.travel.arrivalDate, locale)}
                dir="ltr"
              />
            ) : null
          }
        />
      ) : null}
      {showStay && visit.stay ? (
        <FactRow
          right={<CardFact icon={Building2} label={t('accommodations.name')} value={visit.stay.name} />}
          left={
            visit.stay.managerName ? (
              <CardFact
                icon={UserRound}
                label={t('pilgrims.cardStayManager')}
                value={visit.stay.managerName}
              />
            ) : null
          }
        />
      ) : null}
      {showStay && visit.stay?.address ? (
        <FactRow
          single={
            <CardFact
              icon={MapPin}
              label={t('pilgrims.cardStayAddress')}
              value={visit.stay.address}
              wide
            />
          }
        />
      ) : null}
      {showStay && visit.stay && (visit.stay.phone || visit.stay.managerPhone) ? (
        <FactRow
          right={
            visit.stay.phone ? (
              <CardFact
                icon={Phone}
                label={t('accommodations.phone')}
                value={<CopyableDigits value={visit.stay.phone} />}
              />
            ) : null
          }
          left={
            visit.stay.managerPhone ? (
              <CardFact
                icon={Phone}
                label={t('pilgrims.cardStayManagerPhone')}
                value={<CopyableDigits value={visit.stay.managerPhone} />}
              />
            ) : null
          }
        />
      ) : null}
    </>
  )
}

function FactRow({
  right,
  left,
  single,
}: {
  right?: ReactNode
  left?: ReactNode
  single?: ReactNode
}) {
  if (single) return <div className="pilgrim-id-card__row pilgrim-id-card__row--single">{single}</div>
  if (!right && !left) return null
  return (
    <div className="pilgrim-id-card__row">
      <div className="pilgrim-id-card__row-cell">{right}</div>
      <div className="pilgrim-id-card__row-cell">{left}</div>
    </div>
  )
}

function CardQr({ value, label }: { value: string; label?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    toDataURL(value, {
      width: 280,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f6e6a', light: '#ffffff' },
    })
      .then((next) => {
        if (!cancelled) setUrl(next)
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [value])

  return (
    <div className="pilgrim-id-card__qr">
      {url ? <img src={url} alt="" /> : <span className="pilgrim-id-card__qr-box" aria-hidden />}
      {label ? <span className="pilgrim-id-card__qr-label">{label}</span> : null}
    </div>
  )
}

function CardFact({
  icon: Icon,
  label,
  value,
  dir,
  wide,
  tone,
  inline,
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  dir?: 'ltr' | 'rtl'
  wide?: boolean
  tone?: 'file'
  inline?: boolean
}) {
  const className = [
    'pilgrim-id-card__fact',
    wide ? 'pilgrim-id-card__fact--wide' : '',
    tone === 'file' ? 'pilgrim-id-card__fact--file' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div className={className}>
      <span className="pilgrim-id-card__fact-icon">
        <Icon aria-hidden />
      </span>
      <div className={`pilgrim-id-card__fact-text${inline ? ' pilgrim-id-card__fact-text--inline' : ''}`}>
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
