import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLogo } from '../../components/brand/AppLogo'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { languageDir } from '../../i18n'
import { getImageUrl } from '../../lib/api'
import { collaborationYears, formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { useBrandDisplay } from '../../hooks/useHeadquartersSummary'
import type { PublicProfile, RoleOption } from '../../types/app'

function displayRoles(roles: RoleOption[]) {
  const hidePilgrim = roles.some(
    (role) => role.code === 'CARAVAN_MANAGER' || role.code === 'ACCOMMODATION_MANAGER',
  )
  return roles.filter((role) => !(hidePilgrim && role.code === 'PILGRIM'))
}

export const PublicProfileCard = forwardRef<
  HTMLDivElement,
  { profile: PublicProfile; qrUrl?: string | null }
>(function PublicProfileCard({ profile, qrUrl }, ref) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()
  const { title: brandTitle, logoSrc } = useBrandDisplay()
  const photoUrl = profile.photoId ? getImageUrl(profile.photoId) : null
  const place = [profile.country, profile.province, profile.city]
    .filter(Boolean)
    .map((item) => geoName(item!))
    .join(' · ')
  const years = collaborationYears(profile.activityStartYear)
  const roles = displayRoles(profile.roles)

  return (
    <div ref={ref} className="member-card" dir={languageDir(locale)}>
      <div className="member-card__header">
        <div className="member-card__header-pattern" aria-hidden />
        <div className="member-card__header-row">
          <div className="member-card__header-main">
            <div className="member-card__brand">
              <AppLogo src={logoSrc} className="member-card__logo" decorative />
              <div>
                <p className="member-card__app">{brandTitle}</p>
                <h2 className="member-card__title">{t('publicProfile.cardTitle')}</h2>
              </div>
            </div>
            {roles.length ? (
              <div className="member-card__badges">
                {roles.map((role) => (
                  <span key={role.code} className="member-card__badge">
                    {t(role.nameKey)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {qrUrl ? (
            <img src={qrUrl} alt="" className="member-card__qr" />
          ) : (
            <div className="member-card__qr" aria-hidden />
          )}
        </div>
      </div>
      <div className="member-card__gold" />
      <div className="member-card__body">
        <div className="member-card__identity">
          <div className="member-card__photo-wrap">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt=""
                className="member-card__photo"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="member-card__photo-fallback" aria-hidden>
                {initials(profile.firstName, profile.lastName)}
              </div>
            )}
          </div>
          <div>
            <p className="member-card__name">{profile.fullName}</p>
            {place ? <p className="member-card__place">{place}</p> : null}
          </div>
        </div>

        <div className="member-card__facts">
          <div className="member-card__fact">
            <p className="member-card__fact-label">{t('users.nationalId')}</p>
            <p className="member-card__fact-value">
              <CopyableDigits value={profile.nationalId} />
            </p>
          </div>
          <div className="member-card__fact">
            <p className="member-card__fact-label">{t('users.phone')}</p>
            <p className="member-card__fact-value">
              <CopyableDigits value={profile.phone} />
            </p>
          </div>
        </div>

        {years != null && profile.activityStartYear != null ? (
          <div className="member-card__years-row">
            <div className="member-card__fact">
              <p className="member-card__fact-label">{t('publicProfile.activityStart')}</p>
              <p className="member-card__fact-value">
                {formatNumber(profile.activityStartYear, locale)}
              </p>
            </div>
            <div className="member-card__years">
              <span className="member-card__years-num">{formatNumber(years, locale)}</span>
              <span className="member-card__years-label">{t('publicProfile.yearsLabel')}</span>
            </div>
          </div>
        ) : null}
      </div>
      <div className="member-card__footer">
        <span className="member-card__footer-dot" aria-hidden />
        <span>{t('publicProfile.footer')}</span>
        <span className="member-card__footer-dot" aria-hidden />
      </div>
    </div>
  )
})

function initials(firstName: string, lastName: string) {
  const a = firstName.trim().charAt(0)
  const b = lastName.trim().charAt(0)
  return `${a}${b}` || '؟'
}
