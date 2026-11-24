import {
  AlignLeft,
  BadgeCheck,
  Building2,
  Calendar,
  FileImage,
  Flag,
  History,
  IdCard,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  Share2,
  Tent,
  Ticket,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { DateText, YearEquivalents } from '../../components/ui/DateText'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  DetailActions,
  PageHeader,
  cardClassName,
  listShellClassName,
} from '../../components/ui/Form'
import { FormCardHeaderDecor } from '../../components/ui/FormLayout'
import {
  ActionsTh,
  EntityRowActions,
  PaginationBar,
  SortableTh,
  TableCard,
  actionsColClassName,
} from '../../components/ui/ListControls'
import { placementPanelClassName } from '../../components/ui/placementTab'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useListParams } from '../../hooks/useListParams'
import { useListSort } from '../../hooks/useListSort'
import { useAuth } from '../../auth/AuthProvider'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isAdmin } from '../../lib/roles'
import type {
  Caravan,
  CaravanPilgrimageHistoryItem,
  CaravanStayPlacement,
  Paginated,
} from '../../types/app'
import { AccommodationImagesGallery } from '../accommodations/AccommodationImagesField'
import { HeadcountPills } from '../reservations/HeadcountPills'
import { ReservationCodeBadge } from '../reservations/ReservationCodeBadge'
import { ReservationStatusBadge } from '../reservations/ReservationStatusBadge'
import {
  createWizardPath,
  isOwnerCreateDraft,
  listHeadcount,
} from '../reservations/reservation-steps'
import { CaravanStatusBadge } from './CaravanStatusBadge'
import { CaravanTabNav, caravanTabs, type CaravanTab } from './CaravanTabs'

type Tone = 'teal' | 'mint' | 'ink'

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
    icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
  },
  mint: {
    wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
    icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190),0.24)]',
  },
  ink: {
    wrap: 'border-line bg-gradient-to-b from-cream-50 to-white',
    icon: 'bg-ink-700 text-white',
  },
}

export function CaravanDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { confirmDelete } = useConfirmDelete()
  const fromMine = useLocation().pathname.startsWith('/my-caravans')
  const listPath = fromMine ? '/my-caravans' : '/caravans'
  const reservationBase = fromMine ? '/my-reservations' : '/reservations'
  const [tab, setTab] = useState<CaravanTab>('basic')
  const { page, setPage, searchParams, setParams } = useListParams()
  const { sortBy, sortDir, sortParams, onSort } = useListSort(searchParams, setParams)
  const query = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })
  const placementsQuery = useQuery({
    queryKey: ['caravan', id, 'placements'],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<{ year: number; items: CaravanStayPlacement[] }>(
        `/caravans/${id}/placements`,
      )
      return data
    },
  })
  const stays = placementsQuery.data?.items ?? []
  const filesQuery = useQuery({
    queryKey: ['caravan', id, 'pilgrimage-history', page, sortBy, sortDir],
    enabled: Boolean(id) && tab === 'files',
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data } = await api.get<Paginated<CaravanPilgrimageHistoryItem>>(
        `/caravans/${id}/pilgrimage-history`,
        { params: { page, ...sortParams } },
      )
      return data
    },
  })
  const files = filesQuery.data?.items ?? []

  const caravan = query.data
  if (!caravan) {
    return <LoadingState />
  }

  const country = caravan.city?.province?.country
    ? nameOf(caravan.city.province.country)
    : ''
  const province = caravan.city?.province ? nameOf(caravan.city.province) : ''
  const city = caravan.city ? nameOf(caravan.city) : ''
  const empty = '—'
  const licenseImageIds = caravan.licenseImageIds?.length
    ? caravan.licenseImageIds
    : caravan.licenseImageId
      ? [caravan.licenseImageId]
      : []
  const tabs: CaravanTab[] = stays.length
    ? [...caravanTabs, 'files', 'placement']
    : [...caravanTabs, 'files']

  return (
    <div className={listShellClassName}>
      <PageHeader
        icon={Tent}
        title={t('caravans.details')}
        subtitle={<EntityNameSubtitle name={caravan.name} icon={Tent} />}
      />

      <div className="space-y-4">
      <section className={`${cardClassName} overflow-hidden`}>
        <header className="relative overflow-hidden bg-gradient-to-e from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
          <FormCardHeaderDecor />
          <div className="relative flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <Tent className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink-900">{caravan.name}</h2>
                <CaravanStatusBadge status={caravan.status} isActive={caravan.isActive} />
              </div>
              <p className="mt-1 text-xs leading-6 text-ink-600">
                {t('caravans.detailsSubtitle')}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {city ? (
                  <MetaChip icon={MapPin} label={city} />
                ) : null}
                {caravan.manager ? (
                  <MetaChip icon={UserRound} label={caravan.manager.fullName} />
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <CaravanTabNav tab={tab} tabs={tabs} onChange={setTab} />

          {tab === 'placement' ? (
            <section className={placementPanelClassName}>
              <SectionTitle icon={MapPinned}>{t('placements.managerStaysTitle')}</SectionTitle>
              <p className="text-sm font-medium text-mint-800">
                {t('placements.caravanStaysHint', {
                  year: n(placementsQuery.data?.year ?? currentPersianYear()),
                })}
              </p>
              <div className="grid gap-3">
                {stays.map((stay) => (
                  <article
                    key={stay.id}
                    className="rounded-2xl border-2 border-mint-300 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint-500 text-white shadow-[0_8px_16px_rgba(63,214,190,0.28)]">
                          <Building2 className="size-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-mint-800">
                            {t('placements.stayLocation')}
                          </p>
                          <p className="text-lg font-bold text-ink-900">{stay.name}</p>
                          {stay.city ? (
                            <p className="text-sm text-ink-500">{nameOf(stay.city)}</p>
                          ) : null}
                        </div>
                      </div>
                      <EntityRowActions viewTo={`/accommodations/${stay.id}`} />
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <p className="text-sm text-ink-700">
                        <span className="font-medium">{t('accommodations.address')}: </span>
                        {stay.address || empty}
                      </p>
                      <p className="text-sm text-ink-700">
                        <span className="font-medium">{t('accommodations.phone')}: </span>
                        {stay.phone ? <CopyableDigits value={stay.phone} /> : empty}
                      </p>
                      <p className="text-sm text-ink-700">
                        <span className="font-medium">{t('accommodations.yearMaleCount')}: </span>
                        {n(stay.placedMaleCount)}
                      </p>
                      <p className="text-sm text-ink-700">
                        <span className="font-medium">{t('accommodations.yearFemaleCount')}: </span>
                        {n(stay.placedFemaleCount)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {tab === 'basic' ? (
          <>
          <section>
            <SectionTitle icon={MapPin}>{t('caravans.sectionLocation')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
              <FactTile
                icon={Flag}
                label={t('geo.country')}
                value={country || empty}
                empty={!country}
                tone="teal"
              />
              <FactTile
                icon={MapPin}
                label={t('geo.province')}
                value={province || empty}
                empty={!province}
                tone="mint"
              />
              <FactTile
                icon={Building2}
                label={t('caravans.city')}
                value={city || empty}
                empty={!city}
                tone="ink"
              />
            </div>
          </section>

          <section>
            <SectionTitle icon={UserRound}>{t('caravans.sectionManager')}</SectionTitle>
            {caravan.manager ? (
              <article className="rounded-2xl border border-teal-100 bg-gradient-to-b from-teal-50 to-white p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-sm font-bold text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
                    {personInitials(caravan.manager.firstName, caravan.manager.lastName)}
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <p className="text-sm font-semibold text-ink-900">
                      {caravan.manager.fullName}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FactTile
                        icon={IdCard}
                        label={t('users.nationalId')}
                        value={<CopyableDigits value={caravan.manager.nationalId} empty={empty} />}
                        empty={!caravan.manager.nationalId}
                        tone="teal"
                      />
                      <FactTile
                        icon={Phone}
                        label={t('users.phone')}
                        value={<CopyableDigits value={caravan.manager.phone} empty={empty} />}
                        empty={!caravan.manager.phone}
                        tone="mint"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ) : (
              <EmptyHint>{t('caravans.managerEmpty')}</EmptyHint>
            )}
          </section>
          </>
          ) : null}

          {tab === 'license' ? (
          <section className="space-y-4">
            <SectionTitle icon={BadgeCheck}>{t('caravans.sectionLicense')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FactTile
                icon={BadgeCheck}
                label={t('caravans.licenseNumber')}
                value={
                  caravan.licenseNumber
                    ? localizeDigits(caravan.licenseNumber, locale)
                    : empty
                }
                empty={!caravan.licenseNumber}
                tone="teal"
                className="sm:col-span-2"
              />
              <FactTile
                icon={AlignLeft}
                label={t('caravans.description')}
                value={
                  caravan.description ? (
                    <span className="whitespace-pre-wrap">{caravan.description}</span>
                  ) : (
                    empty
                  )
                }
                empty={!caravan.description}
                tone="mint"
                className="sm:col-span-2"
              />
            </div>
            <div>
              <SectionTitle icon={FileImage}>{t('caravans.licenseImages')}</SectionTitle>
              <AccommodationImagesGallery
                imageIds={licenseImageIds}
                empty={t('caravans.noLicenseImages')}
              />
            </div>
          </section>
          ) : null}

          {tab === 'files' ? (
            <section className="space-y-4">
              <SectionTitle icon={Ticket}>{t('caravans.tabs.files')}</SectionTitle>
              <TableCard
                loading={filesQuery.isLoading}
                empty={t('caravans.filesEmpty')}
                hasRows={files.length > 0}
              >
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <SortableTh
                        column="code"
                        label={t('reservations.code')}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortableTh
                        column="year"
                        label={t('reservations.year')}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={onSort}
                        align="center"
                      />
                      <SortableTh
                        column="stayStartDate"
                        label={t('reservations.stayStartDateShort')}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortableTh
                        column="totalCount"
                        label={t('reservations.totalCount')}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <SortableTh
                        column="status"
                        label={t('reservations.status')}
                        sortBy={sortBy}
                        sortDir={sortDir}
                        onSort={onSort}
                      />
                      <ActionsTh />
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((item) => {
                      const headcount = listHeadcount(item)
                      const viewTo = isOwnerCreateDraft(item)
                        ? createWizardPath(item.id, reservationBase)
                        : `${reservationBase}/${item.id}`
                      return (
                        <tr key={item.id} className="border-t border-line">
                          <td className="px-4 py-3">
                            <ReservationCodeBadge code={item.code} size="md" />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="space-y-0.5">
                              <div>{n(item.year)}</div>
                              <YearEquivalents year={item.year} stacked />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {item.stayStartDate ? (
                              <DateText value={item.stayStartDate} />
                            ) : (
                              empty
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <HeadcountPills
                              type={item.type}
                              male={headcount.male}
                              female={headcount.female}
                              total={headcount.total}
                              format={n}
                              maleLabel={t('caravans.countMale')}
                              femaleLabel={t('caravans.countFemale')}
                              totalLabel={t('reservations.countTotal')}
                              stacked
                            />
                          </td>
                          <td className="px-4 py-3">
                            <ReservationStatusBadge status={item.status} />
                          </td>
                          <td className={actionsColClassName}>
                            <EntityRowActions viewTo={viewTo} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </TableCard>
              {filesQuery.data ? (
                <PaginationBar
                  page={filesQuery.data.page}
                  pageSize={filesQuery.data.pageSize}
                  total={filesQuery.data.total}
                  onPageChange={setPage}
                />
              ) : null}
            </section>
          ) : null}

          {tab === 'extra' ? (
          <section>
            <SectionTitle icon={Building2}>{t('caravans.sectionOffice')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FactTile
                icon={Calendar}
                label={t('caravans.foundedYear')}
                value={
                  caravan.foundedYear != null ? n(caravan.foundedYear) : empty
                }
                empty={caravan.foundedYear == null}
                tone="teal"
              />
              <FactTile
                icon={Phone}
                label={t('caravans.officePhone')}
                value={
                  caravan.officePhone
                    ? localizeDigits(caravan.officePhone, locale)
                    : empty
                }
                empty={!caravan.officePhone}
                tone="mint"
              />
              <FactTile
                icon={MapPin}
                label={t('caravans.officeAddress')}
                value={caravan.officeAddress || empty}
                empty={!caravan.officeAddress}
                tone="ink"
                className="sm:col-span-2"
              />
            </div>
          </section>
          ) : null}

          {tab === 'social' ? (
          <section>
            <SectionTitle icon={Share2}>{t('caravans.sectionSocial')}</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FactTile
                icon={MessageCircle}
                label={t('caravans.eitaa')}
                value={caravan.eitaa || empty}
                empty={!caravan.eitaa}
                tone="teal"
              />
              <FactTile
                icon={MessageCircle}
                label={t('caravans.bale')}
                value={caravan.bale || empty}
                empty={!caravan.bale}
                tone="mint"
              />
              <FactTile
                icon={Share2}
                label={t('caravans.telegram')}
                value={caravan.telegram || empty}
                empty={!caravan.telegram}
                tone="ink"
              />
              <FactTile
                icon={Share2}
                label={t('caravans.instagram')}
                value={caravan.instagram || empty}
                empty={!caravan.instagram}
                tone="teal"
              />
            </div>
          </section>
          ) : null}
        </div>

        <div className="border-t border-line px-5 py-4 sm:px-6">
          <DetailActions
            className=""
            editTo={`${listPath}/${caravan.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={isAdmin(user) ? t('caravans.delete') : undefined}
            onDelete={
              isAdmin(user)
                ? () =>
                    confirmDelete({
                      message: t('caravans.confirmDelete'),
                      successMessage: t('caravans.deleted'),
                      path: `/caravans/${caravan.id}`,
                      queryKey: ['caravans'],
                      onDeleted: () => navigate(listPath),
                    })
                : undefined
            }
            extra={
              <Link to={`${listPath}/${caravan.id}/pilgrimage-history`}>
                <Button type="button" variant="soft">
                  <History className="size-4" aria-hidden />
                  {t('caravanPilgrimageHistory.manage')}
                </Button>
              </Link>
            }
          />
        </div>
      </section>
      </div>
    </div>
  )
}

function personInitials(firstName: string, lastName: string) {
  const first = firstName.trim().charAt(0)
  const last = lastName.trim().charAt(0)
  return `${first}${last}` || '؟'
}

function MetaChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 shadow-[0_4px_10px_rgba(20,40,40,0.05)] ring-1 ring-teal-100">
      <Icon className="size-3 text-teal-600" aria-hidden />
      {label}
    </span>
  )
}

function SectionTitle({
  icon: Icon,
  children,
  className = 'mb-2.5',
}: {
  icon: LucideIcon
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      className={`inline-flex items-center gap-2 text-xs font-semibold text-ink-600 ${className}`}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {children}
    </h3>
  )
}

function FactTile({
  icon: Icon,
  label,
  value,
  empty,
  tone,
  className = '',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  empty?: boolean
  tone: Tone
  className?: string
}) {
  const colors = toneClass[tone]
  return (
    <article
      className={`relative z-10 flex items-start gap-3 rounded-2xl border px-3 py-3 ${colors.wrap} ${className}`}
    >
      <span
        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl ${colors.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-ink-500">{label}</p>
        <div
          className={`mt-0.5 text-sm font-semibold break-words ${
            empty ? 'text-ink-400' : 'text-ink-900'
          }`}
        >
          {value}
        </div>
      </div>
    </article>
  )
}

function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-line bg-cream-50 px-4 py-6 text-center text-sm text-ink-400">
      {children}
    </p>
  )
}
