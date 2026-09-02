import { Mars, Venus } from 'lucide-react'
import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '../../components/brand/AppLogo'
import { languageDir } from '../../i18n'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useBrandDisplay } from '../../hooks/useHeadquartersSummary'

export type PlaceCardFact = {
  label: string
  value: string
  wide?: boolean
}

function CapacityBoxes({
  male,
  female,
  maleLabel,
  femaleLabel,
  locale,
}: {
  male: number
  female: number
  maleLabel: string
  femaleLabel: string
  locale: string
}) {
  return (
    <>
      <div className="place-card__capacity-item place-card__capacity-item--male">
        <span className="place-card__capacity-icon" aria-hidden>
          <Mars className="size-4" />
        </span>
        <div>
          <p className="place-card__capacity-label">{maleLabel}</p>
          <p className="place-card__capacity-value">{formatNumber(male, locale)}</p>
        </div>
      </div>
      <div className="place-card__capacity-item place-card__capacity-item--female">
        <span className="place-card__capacity-icon" aria-hidden>
          <Venus className="size-4" />
        </span>
        <div>
          <p className="place-card__capacity-label">{femaleLabel}</p>
          <p className="place-card__capacity-value">{formatNumber(female, locale)}</p>
        </div>
      </div>
    </>
  )
}

export const PublicPlaceCard = forwardRef<
  HTMLDivElement,
  {
    kind: 'accommodation' | 'station'
    name: string
    badges?: string[]
    capacities?: { male: number; female: number } | null
    distance?: PlaceCardFact | null
    facts?: PlaceCardFact[]
    amenities?: string[]
    qrUrl?: string | null
  }
>(function PublicPlaceCard(
  { kind, name, badges = [], capacities, distance, facts = [], amenities = [], qrUrl },
  ref,
) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { title: brandTitle, logoSrc } = useBrandDisplay()
  const keys = kind === 'accommodation' ? 'publicAccommodation' : 'publicWalkingStation'
  const maleLabel =
    kind === 'accommodation' ? t('accommodations.maleCapacity') : t('publicWalkingStation.male')
  const femaleLabel =
    kind === 'accommodation' ? t('accommodations.femaleCapacity') : t('publicWalkingStation.female')
  const showStationMetrics = kind === 'station' && Boolean(capacities || distance)

  return (
    <div ref={ref} className="place-card" dir={languageDir(locale)}>
      <div className="place-card__header">
        <div className="place-card__header-pattern" aria-hidden />
        <div className="place-card__header-row">
          <div className="place-card__header-main">
            <div className="place-card__brand">
              <AppLogo src={logoSrc} className="place-card__logo" decorative />
              <div>
                <p className="place-card__app">{brandTitle}</p>
                <h2 className="place-card__kind">{t(`${keys}.cardTitle`)}</h2>
              </div>
            </div>
            {badges.length ? (
              <div className="place-card__badges">
                {badges.map((badge) => (
                  <span key={badge} className="place-card__badge">
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {qrUrl ? (
            <img src={qrUrl} alt="" className="place-card__qr" />
          ) : (
            <div className="place-card__qr" aria-hidden />
          )}
        </div>
      </div>
      <div className="place-card__gold" />
      <div className="place-card__body">
        <p className="place-card__name">{name}</p>
        {kind !== 'station' && capacities ? (
          <div className="place-card__capacity">
            <CapacityBoxes
              male={capacities.male}
              female={capacities.female}
              maleLabel={maleLabel}
              femaleLabel={femaleLabel}
              locale={locale}
            />
          </div>
        ) : null}
        {facts.length ? (
          <div className="place-card__facts">
            {facts.map((fact) => (
              <div
                key={`${fact.label}-${fact.value}`}
                className={`place-card__fact${fact.wide ? ' place-card__fact--wide' : ''}`}
              >
                <p className="place-card__fact-label">{fact.label}</p>
                <p className="place-card__fact-value">{localizeDigits(fact.value, locale)}</p>
              </div>
            ))}
          </div>
        ) : null}
        {showStationMetrics ? (
          <div className="place-card__metrics">
            {distance ? (
              <div className="place-card__fact place-card__metrics-distance">
                <p className="place-card__fact-label">{distance.label}</p>
                <p className="place-card__fact-value">{localizeDigits(distance.value, locale)}</p>
              </div>
            ) : null}
            {capacities ? (
              <div className="place-card__metrics-capacity">
                <CapacityBoxes
                  male={capacities.male}
                  female={capacities.female}
                  maleLabel={maleLabel}
                  femaleLabel={femaleLabel}
                  locale={locale}
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {amenities.length ? (
          <div className="place-card__amenities">
            <p className="place-card__amenities-title">{t(`${keys}.amenities`)}</p>
            <div className="place-card__chips">
              {amenities.map((item) => (
                <span key={item} className="place-card__chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="place-card__footer">
        <span className="place-card__footer-dot" aria-hidden />
        <span>{t(`${keys}.footer`)}</span>
        <span className="place-card__footer-dot" aria-hidden />
      </div>
    </div>
  )
})
