import {
  AlignLeft,
  Building2,
  Download,
  MapPin,
  Mars,
  MessageCircle,
  Navigation,
  Phone,
  Route,
  Share2,
  Shirt,
  Venus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { Button, LoadingState } from '../../components/ui/Form'
import { FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { publicAccommodationUrl } from '../../lib/public-place'
import type { PublicAccommodation } from '../../types/app'
import { LandingShell } from '../landing/LandingShell'
import { hasPublicAmenities, listPublicAmenityLabels, PublicAmenityChips } from './PublicAmenityChips'
import { PublicPlaceCard } from './PublicPlaceCard'
import { usePlaceCardImage } from './usePlaceCardImage'

export function PublicAccommodationPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const geoName = useGeoName()
  const query = useQuery({
    queryKey: ['public', 'accommodation', id],
    enabled: Boolean(id),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<PublicAccommodation>(
        `/public/accommodations/${encodeURIComponent(id ?? '')}`,
      )
      return data
    },
  })
  const item = query.data
  const shareUrl = id ? publicAccommodationUrl(id) : ''
  const { cardRef, qrUrl, downloading, downloadCard } = usePlaceCardImage(
    shareUrl,
    `accommodation-${item?.id ?? 'card'}.png`,
    {
      downloaded: t('publicAccommodation.downloaded'),
      failed: t('publicAccommodation.downloadFailed'),
    },
  )

  if (query.isLoading) {
    return (
      <LandingShell>
        <div className="min-h-[50vh]">
          <LoadingState />
        </div>
      </LandingShell>
    )
  }

  if (!item) {
    return (
      <LandingShell>
        <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
          <h1 className="text-lg font-semibold text-ink-900">{t('publicAccommodation.notFoundTitle')}</h1>
          <p className="mt-2 text-sm text-ink-500">{t('publicAccommodation.notFound')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('publicAccommodation.notFoundHint')}</p>
        </div>
      </LandingShell>
    )
  }

  const place = [item.city, item.province, item.country]
    .filter(Boolean)
    .map((geo) => geoName(geo!))
    .join(' · ')
  const km = (value: number | null) =>
    value == null ? '' : `${formatNumber(value, locale)} ${t('accommodations.km')}`
  const coords = item.latitude != null && item.longitude != null
    ? { lat: item.latitude, lng: item.longitude }
    : null

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-teal-700">
            {t('publicAccommodation.title')}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink-900 sm:text-3xl">{item.name}</h1>
          {place ? <p className="mt-2 text-sm text-ink-500">{place}</p> : null}
        </div>

        <div className="mb-8 flex flex-col items-center gap-5">
          <PublicPlaceCard
            ref={cardRef}
            kind="accommodation"
            name={item.name}
            badges={[t(`managementTypes.${item.managementType}`)]}
            capacities={{ male: item.maleCapacity, female: item.femaleCapacity }}
            facts={[
              ...(item.province ? [{ label: t('geo.province'), value: geoName(item.province) }] : []),
              ...(item.city ? [{ label: t('geo.city'), value: geoName(item.city) }] : []),
              ...(item.address?.trim()
                ? [{ label: t('accommodations.address'), value: item.address, wide: true }]
                : []),
              ...(item.neshanAddress?.trim()
                ? [{ label: t('accommodations.neshanAddress'), value: item.neshanAddress, wide: true }]
                : []),
            ]}
            amenities={listPublicAmenityLabels(item, t, locale, 'accommodations')}
            qrUrl={qrUrl}
          />
          <Button type="button" onClick={() => void downloadCard()} disabled={downloading || !qrUrl}>
            <Download className="size-4" aria-hidden />
            {downloading ? t('publicAccommodation.downloading') : t('publicAccommodation.download')}
          </Button>
        </div>

        <section className="space-y-6 rounded-[28px] border border-white bg-white p-5 shadow-[0_10px_30px_rgba(20,40,40,0.05)] sm:p-6">
          <div>
            <FormSectionTitle icon={Building2}>{t('publicAccommodation.facts')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Building2}
                label={t('accommodations.type')}
                value={t(`accommodationTypes.${item.type}`)}
                tone="teal"
              />
              <FormFactTile
                icon={Mars}
                label={t('accommodations.genderType')}
                value={t(`genderTypes.${item.genderType}`)}
                tone="mint"
              />
              <FormFactTile
                icon={Mars}
                label={t('accommodations.maleCapacity')}
                value={formatNumber(item.maleCapacity, locale)}
                tone="ink"
              />
              <FormFactTile
                icon={Venus}
                label={t('accommodations.femaleCapacity')}
                value={formatNumber(item.femaleCapacity, locale)}
                tone="teal"
              />
              {item.phone ? (
                <FormFactTile
                  icon={Phone}
                  label={t('accommodations.phone')}
                  value={<CopyableDigits value={item.phone} />}
                  tone="mint"
                />
              ) : null}
              {item.distanceToShrineKm != null ? (
                <FormFactTile
                  icon={Route}
                  label={t('accommodations.distanceToShrineKm')}
                  value={km(item.distanceToShrineKm)}
                  tone="ink"
                />
              ) : null}
              {item.distanceToMashhadKm != null ? (
                <FormFactTile
                  icon={Route}
                  label={t('accommodations.distanceToMashhadKm')}
                  value={km(item.distanceToMashhadKm)}
                  tone="teal"
                />
              ) : null}
              {item.address ? (
                <FormFactTile
                  icon={MapPin}
                  label={t('accommodations.address')}
                  value={item.address}
                  tone="mint"
                  className="sm:col-span-2"
                />
              ) : null}
              {item.neshanAddress ? (
                <FormFactTile
                  icon={Navigation}
                  label={t('accommodations.neshanAddress')}
                  value={item.neshanAddress}
                  tone="ink"
                  className="sm:col-span-2"
                />
              ) : null}
              {item.description ? (
                <FormFactTile
                  icon={AlignLeft}
                  label={t('accommodations.description')}
                  value={<span className="whitespace-pre-wrap">{item.description}</span>}
                  tone="teal"
                  className="sm:col-span-2"
                />
              ) : null}
            </div>
          </div>

          {hasPublicAmenities(item) ? (
            <div>
              <FormSectionTitle icon={Shirt}>{t('accommodations.sectionAmenities')}</FormSectionTitle>
              <PublicAmenityChips i18nPrefix="accommodations" amenities={item} />
            </div>
          ) : null}

          {item.eitaa || item.bale || item.otherSocial ? (
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {item.eitaa ? (
                <FormFactTile icon={MessageCircle} label={t('accommodations.eitaa')} value={item.eitaa} tone="teal" />
              ) : null}
              {item.bale ? (
                <FormFactTile icon={Share2} label={t('accommodations.bale')} value={item.bale} tone="mint" />
              ) : null}
              {item.otherSocial ? (
                <FormFactTile
                  icon={Share2}
                  label={t('accommodations.otherSocial')}
                  value={item.otherSocial}
                  tone="ink"
                  className="sm:col-span-2"
                />
              ) : null}
            </div>
          ) : null}

          {coords ? (
            <div>
              <FormSectionTitle icon={MapPin}>{t('accommodations.sectionLocation')}</FormSectionTitle>
              <OsmMapPicker
                latitude={String(coords.lat)}
                longitude={String(coords.lng)}
                onChange={() => undefined}
                variant="always"
                readOnly
                heightClass="h-64"
              />
            </div>
          ) : null}
        </section>
      </div>
    </LandingShell>
  )
}
