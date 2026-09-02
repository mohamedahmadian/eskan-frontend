import {
  AlignLeft,
  DoorOpen,
  MapPin,
  MapPinned,
  Mars,
  MessageCircle,
  Milestone,
  Navigation,
  Phone,
  Route,
  Share2,
  UserRound,
  Venus,
} from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
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
import type { WalkingStation, WalkingStationStay } from '../../types/app'

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function WalkingStationDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirmDelete } = useConfirmDelete()
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

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const coords = stageCoordinates(item)
  const km = (value: number | null | undefined) =>
    value == null ? '' : `${formatNumber(value, locale)} ${t('walkingRoutes.km')}`
  const hasManager =
    hasText(item.managerName) ||
    hasText(item.managerPhone) ||
    hasText(item.managerTelegram) ||
    hasText(item.managerWhatsapp) ||
    hasText(item.managerEitaa)

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('walkingStations.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Milestone} />}
      />
      <FormCard icon={Milestone} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
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
            {hasText(item.neshanAddress) ? (
              <FormFactTile
                icon={Navigation}
                label={t('walkingStations.neshanAddress')}
                value={item.neshanAddress}
                tone="teal"
                className="sm:col-span-2"
              />
            ) : null}
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
            {item.distanceToMashhadKm != null ? (
              <FormFactTile
                icon={Milestone}
                label={t('walkingRoutes.stageDistanceToMashhadKm')}
                value={km(item.distanceToMashhadKm)}
                tone="teal"
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
          <div className="space-y-3">
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
                    message: t('walkingStations.confirmEvacuate'),
                    confirmLabel: t('walkingStations.evacuate'),
                    confirmVariant: 'danger',
                    onConfirm: () => evacuate.mutate(),
                  })
                }
              >
                <DoorOpen className="size-4" aria-hidden />
                {t('walkingStations.evacuate')}
              </Button>
            </div>
            {staysQuery.data?.length ? (
              <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-3 py-2 text-start font-medium">{t('reservations.code')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.stayDate')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.maleCount')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.femaleCount')}</th>
                      <th className="px-3 py-2 text-start font-medium">{t('walkingStations.stayStatus')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staysQuery.data.map((stay) => (
                      <tr key={stay.id} className="border-t border-line">
                        <td className="px-3 py-2">
                          <Link
                            to={`/reservations/${stay.reservation.id}`}
                            className="font-medium text-teal-700 hover:underline"
                          >
                            {stay.reservation.code}
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <DateText value={stay.stayDate} />
                        </td>
                        <td className="px-3 py-2">{formatNumber(stay.maleCount, locale)}</td>
                        <td className="px-3 py-2">{formatNumber(stay.femaleCount, locale)}</td>
                        <td className="px-3 py-2">
                          {t(`walkingStations.stayStatuses.${stay.status}`)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <FormEmptyHint>{t('walkingStations.staysEmpty')}</FormEmptyHint>
            )}
          </div>
          <DetailActions
            editTo={`/base-info/walking-stations/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('walkingStations.delete')}
            extra={
              <Link to="/base-info/walking-routes">
                <Button type="button" variant="soft">
                  <Route className="size-4" aria-hidden />
                  {t('walkingStations.manageRoutes')}
                </Button>
              </Link>
            }
            onDelete={() =>
              confirmDelete({
                message: t('walkingStations.confirmDelete'),
                successMessage: t('walkingStations.deleted'),
                path: `/walking-stations/${item.id}`,
                queryKey: ['walking-stations'],
                onDeleted: () => navigate('/base-info/walking-stations'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
