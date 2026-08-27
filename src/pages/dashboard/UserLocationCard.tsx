import { FileText, MapPin, MapPinned } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import { Button } from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
} from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { DateText } from '../../components/ui/DateText'
import { api } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import { isCaravanManager, isPilgrim } from '../../lib/roles'
import type { ActiveWalkingRoute, ManagedUser } from '../../types/app'
import {
  useAccountLocationHistoryMap,
  useLocationHistoryOverlays,
} from '../location/locationHistoryMap'
import { useWalkingRouteMap, WalkingRouteProgress } from '../location/WalkingRouteProgress'

export function UserLocationCard() {
  const { t } = useTranslation()
  const { user: actor } = useAuth()
  const geoName = useGeoName()
  const query = useQuery({
    queryKey: ['account'],
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>('/account')
      return data
    },
  })
  const showRoute = isCaravanManager(actor)
  const showHistoryTrail = isPilgrim(actor)
  const routeQuery = useQuery({
    queryKey: ['walking-routes', 'active', 'me'],
    enabled: showRoute,
    queryFn: async () => {
      const { data } = await api.get<ActiveWalkingRoute>('/walking-routes/active')
      return data.route
    },
  })
  const historyQuery = useAccountLocationHistoryMap(showHistoryTrail)

  const user = query.data
  const here = {
    cityId: user?.locationCityId ?? null,
    lat: user?.latitude ?? null,
    lng: user?.longitude ?? null,
  }
  const { overlays: routeOverlays } = useWalkingRouteMap(routeQuery.data, here)
  const historyOverlays = useLocationHistoryOverlays(historyQuery.data)
  const overlays = routeOverlays ?? historyOverlays
  const hasPin = user?.latitude != null && user.longitude != null
  const hasPlace = Boolean(user?.locationProvince || user?.locationCity)
  const hasNotes = Boolean(user?.locationNotes)
  const hasRoute = Boolean(routeQuery.data)
  const hasHistoryTrail = Boolean(historyOverlays?.markers.length)
  const hasMap = hasPin || Boolean(overlays?.markers.length)
  const hasLocation = hasPin || hasPlace || hasNotes || hasRoute || hasHistoryTrail
  const empty = '—'

  return (
    <FormCard
      icon={MapPinned}
      title={t('location.title')}
      subtitle={t('dashboard.locationHint')}
    >
      <div className="space-y-5 p-5 sm:p-6">
        {query.isLoading || (showRoute && routeQuery.isLoading) || (showHistoryTrail && historyQuery.isLoading) ? (
          <p className="text-sm text-ink-500">{t('common.loading')}</p>
        ) : !hasLocation ? (
          <FormEmptyHint>{t('location.empty')}</FormEmptyHint>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={MapPinned}
                label={t('geo.province')}
                value={user?.locationProvince ? geoName(user.locationProvince) : empty}
                empty={!user?.locationProvince}
                tone="teal"
              />
              <FormFactTile
                icon={MapPin}
                label={t('geo.city')}
                value={user?.locationCity ? geoName(user.locationCity) : empty}
                empty={!user?.locationCity}
                tone="mint"
              />
            </div>
            {routeQuery.data ? (
              <WalkingRouteProgress route={routeQuery.data} here={here} />
            ) : null}
            {hasMap ? (
              <div className="overflow-hidden rounded-2xl ring-1 ring-teal-100">
                <OsmMapPicker
                  variant="always"
                  readOnly
                  latitude={hasPin ? String(user!.latitude) : ''}
                  longitude={hasPin ? String(user!.longitude) : ''}
                  overlays={overlays}
                  onChange={() => undefined}
                  heightClass={overlays?.markers.length ? 'h-64 sm:h-80' : 'h-52 sm:h-64'}
                />
              </div>
            ) : null}
            {hasNotes ? (
              <FormFactTile
                icon={FileText}
                label={t('location.notes')}
                value={<span className="whitespace-pre-wrap">{user?.locationNotes}</span>}
                tone="ink"
              />
            ) : null}
            {user?.locationUpdatedAt ? (
              <p className="text-xs text-ink-400">
                {t('location.updatedAt')}
                {' · '}
                <DateText value={user.locationUpdatedAt} withTime />
              </p>
            ) : null}
          </>
        )}
        <Link to="/my-location" className="block">
          <Button type="button" className="w-full justify-center">
            <MapPinned className="size-4" aria-hidden />
            {t('location.registerNew')}
          </Button>
        </Link>
      </div>
    </FormCard>
  )
}
