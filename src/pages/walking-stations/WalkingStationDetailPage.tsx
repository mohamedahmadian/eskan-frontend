import {
  AlignLeft,
  ArrowUpDown,
  Bath,
  BookOpen,
  Car,
  DoorOpen,
  Droplets,
  Flame,
  MapPin,
  MapPinned,
  Mars,
  Maximize2,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Route,
  Share2,
  Shirt,
  Snowflake,
  UserRound,
  Venus,
  Wifi,
} from 'lucide-react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  ToggleField,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { confirmToast } from '../../components/ui/confirmToast'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { stageCoordinates, useGeoName } from '../../lib/geo'
import { publicWalkingStationPath } from '../../lib/public-place'
import { useAuth } from '../../auth/AuthProvider'
import { isAdmin } from '../../lib/roles'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import type { WalkingStation, WalkingStationStay } from '../../types/app'
import { walkingStationBasePath } from './walkingStationPaths'
import { WalkingStationTabNav, type WalkingStationTab } from './WalkingStationTabs'

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function stayPersonLastName(stay: WalkingStationStay) {
  const reservation = stay.reservation
  const person =
    reservation.type === 'CARAVAN'
      ? reservation.caravanManager ?? reservation.createdBy
      : reservation.type === 'GROUP'
        ? reservation.group?.manager ?? reservation.createdBy
        : reservation.createdBy
  return person?.lastName?.trim() || person?.fullName?.trim() || ''
}

export function WalkingStationDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const admin = isAdmin(user)
  const basePath = walkingStationBasePath(pathname)
  const queryClient = useQueryClient()
  const { confirmDelete } = useConfirmDelete()
  const [tab, setTab] = useState<WalkingStationTab>('info')
  const query = useQuery({
    queryKey: ['walking-station', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<WalkingStation>(`/walking-stations/${id}`)
      return data
    },
  })
  const staysQuery = useQuery({
    queryKey: ['walking-station', id, 'stays'],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ items: WalkingStationStay[] }>(
        `/walking-stations/${id}/stays`,
      )
      return data.items
    },
  })
  const evacuate = useMutation({
    mutationFn: async () => {
      await api.post(`/walking-stations/${id}/evacuate`)
    },
    onSuccess: () => {
      toast.success(t('walkingStations.evacuated'))
      void queryClient.invalidateQueries({ queryKey: ['walking-station', id] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })
  const setPresence = useMutation({
    mutationFn: async ({ stayId, present }: { stayId: string; present: boolean }) => {
      await api.patch(`/walking-stations/${id}/stays/${stayId}`, { present })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['walking-station', id, 'stays'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, t('common.error'))),
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const coords = stageCoordinates(item)
  const km = (value: number | null | undefined) =>
    value == null ? '' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`
  const equipped = (value: boolean) =>
    value ? t('walkingStations.equipped') : t('walkingStations.notEquipped')
  const countValue = (value: number | null | undefined) =>
    value == null ? '—' : formatNumber(value, locale)
  const hasManager =
    hasText(item.managerName) ||
    hasText(item.managerPhone) ||
    hasText(item.managerTelegram) ||
    hasText(item.managerWhatsapp) ||
    hasText(item.managerEitaa)

  function panelClass(id: WalkingStationTab) {
    return `space-y-4 ${tab === id ? '' : 'hidden'}`
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('walkingStations.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Milestone} />}
      />
      <FormCard icon={Milestone} title={item.name}>
        <div className="space-y-4 p-5 sm:p-6">
          <WalkingStationTabNav tab={tab} onChange={setTab} />

          <div data-tab="info" className={panelClass('info')}>
            <FormSectionTitle icon={Milestone}>{t('walkingStations.tabs.info')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Milestone}
                label={t('walkingStations.name')}
                value={item.name}
                tone="teal"
              />
              <FormFactTile
                icon={MapPinned}
                label={t('geo.province')}
                value={name(item.city.province)}
                tone="mint"
              />
              <FormFactTile icon={MapPin} label={t('geo.city')} value={name(item.city)} tone="ink" />
              <FormFactTile
                icon={Milestone}
                label={t('walkingRoutes.stageDistanceToMashhadKm')}
                value={km(item.distanceToMashhadKm)}
                empty={item.distanceToMashhadKm == null}
                tone="teal"
              />
              {hasText(item.address) ? (
                <FormFactTile
                  icon={MapPin}
                  label={t('walkingStations.address')}
                  value={<span className="whitespace-pre-wrap">{item.address}</span>}
                  tone="mint"
                  className="sm:col-span-2"
                />
              ) : null}
              {hasText(item.neshanAddress) ? (
                <FormFactTile
                  icon={Navigation}
                  label={t('walkingStations.neshanAddress')}
                  value={item.neshanAddress}
                  tone="teal"
                  className="sm:col-span-2"
                />
              ) : null}
              {hasText(item.description) ? (
                <FormFactTile
                  icon={AlignLeft}
                  label={t('walkingRoutes.description')}
                  value={<span className="whitespace-pre-wrap">{item.description}</span>}
                  tone="mint"
                  className="sm:col-span-2"
                />
              ) : null}
            </div>
            {coords ? (
              <div className="space-y-2">
                <FormSectionTitle icon={MapPinned}>{t('walkingStations.location')}</FormSectionTitle>
                <OsmMapPicker
                  latitude={String(coords.lat)}
                  longitude={String(coords.lng)}
                  onChange={() => undefined}
                  active={tab === 'info'}
                  variant="always"
                  readOnly
                  heightClass="h-64"
                />
              </div>
            ) : null}
            {hasManager ? (
              <div className="space-y-2">
                <FormSectionTitle icon={UserRound}>{t('walkingRoutes.sectionManager')}</FormSectionTitle>
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  {hasText(item.managerName) ? (
                    <FormFactTile
                      icon={UserRound}
                      label={t('walkingStations.managerName')}
                      value={item.managerName}
                      tone="teal"
                    />
                  ) : null}
                  {hasText(item.managerPhone) ? (
                    <FormFactTile
                      icon={Phone}
                      label={t('walkingRoutes.managerPhone')}
                      copyValue={item.managerPhone}
                      tone="mint"
                    />
                  ) : null}
                  {hasText(item.managerWhatsapp) ? (
                    <FormFactTile
                      icon={Phone}
                      label={t('walkingRoutes.managerWhatsapp')}
                      copyValue={item.managerWhatsapp}
                      tone="ink"
                    />
                  ) : null}
                  {hasText(item.managerTelegram) ? (
                    <FormFactTile
                      icon={MessageCircle}
                      label={t('walkingRoutes.managerTelegram')}
                      value={<span dir="ltr">{item.managerTelegram}</span>}
                      tone="teal"
                    />
                  ) : null}
                  {hasText(item.managerEitaa) ? (
                    <FormFactTile
                      icon={Share2}
                      label={t('walkingRoutes.managerEitaa')}
                      value={<span dir="ltr">{item.managerEitaa}</span>}
                      tone="mint"
                    />
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <FormSectionTitle icon={Route}>{t('walkingStations.routes')}</FormSectionTitle>
              {item.routes.length ? (
                <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                  {item.routes.map((route, index) => (
                    <FormFactTile
                      key={route.id}
                      icon={Route}
                      label={`${t('walkingRoutes.stage')} ${formatNumber(route.stageNumber, locale)}`}
                      value={
                        <Link
                          to={`/base-info/walking-routes/${route.id}`}
                          className="text-teal-700 hover:underline"
                        >
                          {route.name}
                        </Link>
                      }
                      tone={index % 2 === 0 ? 'teal' : 'mint'}
                    />
                  ))}
                </div>
              ) : (
                <FormEmptyHint>{t('walkingStations.routesEmpty')}</FormEmptyHint>
              )}
            </div>
          </div>

          <div data-tab="amenities" className={panelClass('amenities')}>
            <FormSectionTitle icon={Shirt}>{t('walkingStations.sectionAmenities')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Shirt}
                label={t('walkingStations.hasLaundry')}
                value={equipped(item.hasLaundry)}
                tone="teal"
              />
              <FormFactTile
                icon={Wifi}
                label={t('walkingStations.hasInternet')}
                value={equipped(item.hasInternet)}
                tone="mint"
              />
              <FormFactTile
                icon={BookOpen}
                label={t('walkingStations.hasPrayerRoom')}
                value={equipped(item.hasPrayerRoom)}
                tone="ink"
              />
              <FormFactTile
                icon={ArrowUpDown}
                label={t('walkingStations.hasElevator')}
                value={equipped(item.hasElevator)}
                tone="teal"
              />
              <FormFactTile
                icon={Flame}
                label={t('walkingStations.heatingSystem')}
                value={item.heatingSystem || '—'}
                empty={!item.heatingSystem}
                tone="mint"
              />
              <FormFactTile
                icon={Snowflake}
                label={t('walkingStations.coolingSystem')}
                value={item.coolingSystem || '—'}
                empty={!item.coolingSystem}
                tone="ink"
              />
              <FormFactTile
                icon={Car}
                label={t('walkingStations.parkingCapacity')}
                value={countValue(item.parkingCapacity)}
                empty={item.parkingCapacity == null}
                tone="teal"
              />
              <FormFactTile
                icon={Bath}
                label={t('walkingStations.bathroomCount')}
                value={countValue(item.bathroomCount)}
                empty={item.bathroomCount == null}
                tone="mint"
              />
              <FormFactTile
                icon={Droplets}
                label={t('walkingStations.toiletCount')}
                value={countValue(item.toiletCount)}
                empty={item.toiletCount == null}
                tone="ink"
              />
              <FormFactTile
                icon={Maximize2}
                label={t('walkingStations.areaSqm')}
                value={item.areaSqm == null ? '—' : formatNumber(item.areaSqm, locale)}
                empty={item.areaSqm == null}
                tone="teal"
              />
            </div>
          </div>

          <div data-tab="stays" className={panelClass('stays')}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FormSectionTitle icon={DoorOpen} className="mb-0">
                {t('walkingStations.stays')}
              </FormSectionTitle>
              <Button
                type="button"
                variant="ghost"
                disabled={evacuate.isPending || !(item.occupiedMaleCount || item.occupiedFemaleCount)}
                onClick={() =>
                  confirmToast({
                    title: t('walkingStations.confirmEvacuate'),
                    confirmLabel: t('walkingStations.evacuate'),
                    cancelLabel: t('common.cancel'),
                    confirmVariant: 'danger',
                    onConfirm: () => evacuate.mutate(),
                  })
                }
              >
                <DoorOpen className="size-4" aria-hidden />
                {t('walkingStations.evacuate')}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Mars}
                label={t('walkingStations.maleCount')}
                value={formatNumber(item.maleCount, locale)}
                tone="mint"
              />
              <FormFactTile
                icon={Venus}
                label={t('walkingStations.femaleCount')}
                value={formatNumber(item.femaleCount, locale)}
                tone="ink"
              />
              <FormFactTile
                icon={Mars}
                label={t('walkingStations.occupiedMaleCount')}
                value={formatNumber(item.occupiedMaleCount ?? 0, locale)}
                tone="teal"
              />
              <FormFactTile
                icon={Venus}
                label={t('walkingStations.occupiedFemaleCount')}
                value={formatNumber(item.occupiedFemaleCount ?? 0, locale)}
                tone="mint"
              />
            </div>
            {staysQuery.data?.length ? (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t('users.lastName')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.stayDate')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('reservations.stationMeal')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('userGenders.MALE')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('userGenders.FEMALE')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.presence')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.stayStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staysQuery.data.map((stay) => {
                      const lastName = stayPersonLastName(stay)
                      const reserved = stay.status === 'RESERVED'
                      return (
                        <tr key={stay.id} className="border-t border-line">
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-start gap-1.5">
                              {lastName ? (
                                <Link
                                  to={`/reservations/${stay.reservation.id}`}
                                  className="font-medium text-teal-700 hover:underline"
                                >
                                  {lastName}
                                </Link>
                              ) : (
                                <span>—</span>
                              )}
                              <ReservationCodeBadge code={stay.reservation.code} size="sm" />
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <DateText value={stay.stayDate} />
                          </td>
                          <td className="px-3 py-2">
                            {t(`reservations.stationMeals.${stay.mealType}`)}
                          </td>
                          <td className="px-3 py-2">{formatNumber(stay.maleCount, locale)}</td>
                          <td className="px-3 py-2">{formatNumber(stay.femaleCount, locale)}</td>
                          <td className="px-3 py-2">
                            {reserved ? (
                              <ToggleField
                                checked={stay.present}
                                disabled={setPresence.isPending}
                                onChange={(present) =>
                                  setPresence.mutate({ stayId: stay.id, present })
                                }
                                onLabel={t('walkingStations.present')}
                                offLabel={t('walkingStations.absent')}
                              />
                            ) : stay.present ? (
                              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                                {t('walkingStations.present')}
                              </span>
                            ) : (
                              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                                {t('walkingStations.absent')}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {t(`walkingStations.stayStatuses.${stay.status}`)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <FormEmptyHint>{t('walkingStations.staysEmpty')}</FormEmptyHint>
            )}
          </div>

          <DetailActions
            editTo={`${basePath}/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={admin ? t('walkingStations.delete') : undefined}
            extra={
              <>
                <Link to={publicWalkingStationPath(item.id)}>
                  <Button type="button" variant="soft">
                    <Milestone className="size-4" aria-hidden />
                    {t('publicWalkingStation.openPage')}
                  </Button>
                </Link>
                {admin ? (
                  <Link to="/base-info/walking-routes">
                    <Button type="button" variant="soft">
                      <Route className="size-4" aria-hidden />
                      {t('walkingStations.manageRoutes')}
                    </Button>
                  </Link>
                ) : null}
              </>
            }
            onDelete={
              admin
                ? () =>
                    confirmDelete({
                      message: t('walkingStations.confirmDelete'),
                      successMessage: t('walkingStations.deleted'),
                      path: `/walking-stations/${item.id}`,
                      queryKey: ['walking-stations'],
                      onDeleted: () => navigate(basePath),
                    })
                : undefined
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
