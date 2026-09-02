import {
  AlignLeft,
  Download,
  MapPin,
  Mars,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Route,
  Shirt,
  UserRound,
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
import { stageCoordinates, useGeoName } from '../../lib/geo'
import { publicWalkingStationUrl } from '../../lib/public-place'
import type { PublicWalkingStation } from '../../types/app'
import { LandingShell } from '../landing/LandingShell'
import { hasPublicAmenities, PublicAmenityChips } from './PublicAmenityChips'
import { PublicPlaceCard } from './PublicPlaceCard'
import { usePlaceCardImage } from './usePlaceCardImage'

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function PublicWalkingStationPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const geoName = useGeoName()
  const query = useQuery({
    queryKey: ['public', 'walking-station', id],
    enabled: Boolean(id),
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<PublicWalkingStation>(
        `/public/walking-stations/${encodeURIComponent(id ?? '')}`,
      )
      return data
    },
  })
  const item = query.data
  const shareUrl = id ? publicWalkingStationUrl(id) : ''
  const { cardRef, qrUrl, downloading, downloadCard } = usePlaceCardImage(
    shareUrl,
    `station-${item?.id ?? 'card'}.png`,
    {
      downloaded: t('publicWalkingStation.downloaded'),
      failed: t('publicWalkingStation.downloadFailed'),
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
          <h1 className="text-lg font-semibold text-ink-900">{t('publicWalkingStation.notFoundTitle')}</h1>
          <p className="mt-2 text-sm text-ink-500">{t('publicWalkingStation.notFound')}</p>
          <p className="mt-1 text-xs text-ink-400">{t('publicWalkingStation.notFoundHint')}</p>
        </div>
      </LandingShell>
    )
  }

  const place = [geoName(item.city), geoName(item.city.province)].filter(Boolean).join(' · ')
  const coords = stageCoordinates(item)
  const hasManager =
    hasText(item.managerName) ||
    hasText(item.managerPhone) ||
    hasText(item.managerTelegram) ||
    hasText(item.managerWhatsapp) ||
    hasText(item.managerEitaa)

  return (
    <LandingShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-wide text-teal-700">
            {t('publicWalkingStation.title')}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-ink-900 sm:text-3xl">{item.name}</h1>
          <p className="mt-2 text-sm text-ink-500">{place}</p>
        </div>

        <div className="mb-8 flex flex-col items-center gap-5">
          <PublicPlaceCard
            ref={cardRef}
            kind="station"
            name={item.name}
            place={place}
            chips={item.routes.map((route) => route.name)}
            qrUrl={qrUrl}
          />
          <Button type="button" onClick={() => void downloadCard()} disabled={downloading || !qrUrl}>
            <Download className="size-4" aria-hidden />
            {downloading ? t('publicWalkingStation.downloading') : t('publicWalkingStation.download')}
          </Button>
        </div>

        <section className="space-y-6 rounded-[28px] border border-white bg-white p-5 shadow-[0_10px_30px_rgba(20,40,40,0.05)] sm:p-6">
          <div>
            <FormSectionTitle icon={Milestone}>{t('publicWalkingStation.facts')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile icon={MapPin} label={t('geo.city')} value={geoName(item.city)} tone="teal" />
              <FormFactTile
                icon={MapPin}
                label={t('geo.province')}
                value={geoName(item.city.province)}
                tone="mint"
              />
              <FormFactTile
                icon={Mars}
                label={t('walkingStations.maleCount')}
                value={formatNumber(item.maleCount, locale)}
                tone="ink"
              />
              <FormFactTile
                icon={Venus}
                label={t('walkingStations.femaleCount')}
                value={formatNumber(item.femaleCount, locale)}
                tone="teal"
              />
              {item.distanceToMashhadKm != null ? (
                <FormFactTile
                  icon={Milestone}
                  label={t('walkingRoutes.stageDistanceToMashhadKm')}
                  value={`${formatNumber(item.distanceToMashhadKm, locale)} ${t('walkingRoutes.km')}`}
                  tone="mint"
                />
              ) : null}
              {hasText(item.neshanAddress) ? (
                <FormFactTile
                  icon={Navigation}
                  label={t('walkingStations.neshanAddress')}
                  value={item.neshanAddress}
                  tone="ink"
                  className="sm:col-span-2"
                />
              ) : null}
              {hasText(item.description) ? (
                <FormFactTile
                  icon={AlignLeft}
                  label={t('walkingRoutes.description')}
                  value={<span className="whitespace-pre-wrap">{item.description}</span>}
                  tone="teal"
                  className="sm:col-span-2"
                />
              ) : null}
            </div>
          </div>

          {hasPublicAmenities(item) ? (
            <div>
              <FormSectionTitle icon={Shirt}>{t('walkingStations.sectionAmenities')}</FormSectionTitle>
              <PublicAmenityChips i18nPrefix="walkingStations" amenities={item} />
            </div>
          ) : null}

          {hasManager ? (
            <div>
              <FormSectionTitle icon={UserRound}>{t('walkingRoutes.sectionManager')}</FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {hasText(item.managerName) ? (
                  <FormFactTile icon={UserRound} label={t('walkingStations.managerName')} value={item.managerName} tone="teal" />
                ) : null}
                {hasText(item.managerPhone) ? (
                  <FormFactTile
                    icon={Phone}
                    label={t('walkingStations.managerPhone')}
                    value={<CopyableDigits value={item.managerPhone} />}
                    tone="mint"
                  />
                ) : null}
                {hasText(item.managerWhatsapp) ? (
                  <FormFactTile
                    icon={MessageCircle}
                    label={t('walkingRoutes.managerWhatsapp')}
                    value={item.managerWhatsapp}
                    tone="ink"
                  />
                ) : null}
                {hasText(item.managerTelegram) ? (
                  <FormFactTile
                    icon={MessageCircle}
                    label={t('walkingRoutes.managerTelegram')}
                    value={item.managerTelegram}
                    tone="teal"
                  />
                ) : null}
                {hasText(item.managerEitaa) ? (
                  <FormFactTile
                    icon={MessageCircle}
                    label={t('walkingRoutes.managerEitaa')}
                    value={item.managerEitaa}
                    tone="mint"
                  />
                ) : null}
              </div>
            </div>
          ) : null}

          {item.routes.length ? (
            <div>
              <FormSectionTitle icon={Route}>{t('publicWalkingStation.routes')}</FormSectionTitle>
              <div className="flex flex-wrap gap-2">
                {item.routes.map((route) => (
                  <span
                    key={route.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1.5 text-xs font-semibold text-mint-800 ring-1 ring-mint-100"
                  >
                    {route.name}
                    <span className="text-ink-400">
                      {`${t('walkingRoutes.stage')} ${formatNumber(route.stageNumber, locale)}`}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {coords ? (
            <div>
              <FormSectionTitle icon={MapPin}>{t('walkingStations.location')}</FormSectionTitle>
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
