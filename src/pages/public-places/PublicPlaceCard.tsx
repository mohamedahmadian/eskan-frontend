import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '../../components/brand/AppLogo'
import { languageDir } from '../../i18n'
import { useBrandDisplay } from '../../hooks/useHeadquartersSummary'

export const PublicPlaceCard = forwardRef<
  HTMLDivElement,
  {
    kind: 'accommodation' | 'station'
    name: string
    place?: string
    chips?: string[]
    qrUrl?: string | null
  }
>(function PublicPlaceCard({ kind, name, place, chips = [], qrUrl }, ref) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { title: brandTitle, logoSrc } = useBrandDisplay()
  const keys = kind === 'accommodation' ? 'publicAccommodation' : 'publicWalkingStation'

  return (
    <div ref={ref} className="place-card" dir={languageDir(locale)}>
      <div className="place-card__header">
        <div className="place-card__header-pattern" aria-hidden />
        <div className="place-card__brand">
          <AppLogo src={logoSrc} className="place-card__logo" decorative />
          <div>
            <p className="place-card__app">{brandTitle}</p>
            <h2 className="place-card__kind">{t(`${keys}.cardTitle`)}</h2>
          </div>
        </div>
      </div>
      <div className="place-card__gold" />
      <div className="place-card__body">
        <p className="place-card__name">{name}</p>
        {place ? <p className="place-card__place">{place}</p> : null}
        {chips.length ? (
          <div className="place-card__chips">
            {chips.map((chip) => (
              <span key={chip} className="place-card__chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        <div className="place-card__qr-row">
          {qrUrl ? <img src={qrUrl} alt="" className="place-card__qr" /> : <div className="place-card__qr" aria-hidden />}
          <p className="place-card__qr-hint">{t(`${keys}.scanHint`)}</p>
        </div>
      </div>
      <div className="place-card__footer">
        <span className="place-card__footer-dot" aria-hidden />
        <span>{t(`${keys}.footer`)}</span>
        <span className="place-card__footer-dot" aria-hidden />
      </div>
    </div>
  )
})
