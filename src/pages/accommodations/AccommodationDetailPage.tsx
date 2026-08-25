import {
  AlignLeft,
  ArrowUpDown,
  BadgeCheck,
  Bath,
  BookOpen,
  Building2,
  Calendar,
  Car,
  ClipboardCheck,
  Compass,
  Droplets,
  Flag,
  Flame,
  HeartPulse,
  IdCard,
  Landmark,
  MapPin,
  MapPinned,
  Mars,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  Route,
  Share2,
  Shield,
  Shirt,
  Snowflake,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  Venus,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import {
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
  FormMetaChip,
  FormSectionTitle,
  formToneClass,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { currentPersianYear, formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Accommodation, AccommodationStatus } from '../../types/app'
import {
  accommodationContactRoles,
  type AccommodationContactRole,
} from './accommodationContacts'
import { AccommodationYearAlert, managerDisplayName } from './AccommodationYearAlert'
import { AccommodationTabNav, accommodationTabs, type AccommodationTab } from './AccommodationTabs'
import { PilgrimNameLink } from './PilgrimNameLink'

const roleIcons: Record<AccommodationContactRole, LucideIcon> = {
  DEPUTY: UserCog,
  RECEPTION: ClipboardCheck,
  FACILITIES_SAFETY: Wrench,
  SECURITY: Shield,
  HEALTH: HeartPulse,
  CULTURAL: Landmark,
  LOGISTICS_SUPPORT: Package,
}

export function AccommodationDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const n = (value: number) => formatNumber(value, locale)
  const nameOf = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const fromMine = useLocation().pathname.startsWith('/my-accommodations')
  const listPath = fromMine ? '/my-accommodations' : '/accommodations'
  const { confirmDelete } = useConfirmDelete()
  const [tab, setTab] = useState<AccommodationTab>('general')
  const query = useQuery({
    queryKey: ['accommodation', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Accommodation>(`/accommodations/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const empty = '—'
  const country = item.country ? nameOf(item.country) : ''
  const province = item.province ? nameOf(item.province) : ''
  const city = item.city ? nameOf(item.city) : ''
  const totalCapacity = item.maleCapacity + item.femaleCapacity
  const filledContacts =
    item.contacts?.filter((contact) =>
      accommodationContactRoles.includes(contact.role as AccommodationContactRole),
    ).length ?? 0
  const currentYear = currentPersianYear()
  const yearContacts = [...(item.yearContacts ?? [])].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : a.role.localeCompare(b.role),
  )
  const managers = [...item.managers].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : Number(b.isPrimary) - Number(a.isPrimary),
  )

  function panelClass(id: AccommodationTab) {
    return `space-y-4 ${tab === id ? '' : 'hidden'}`
  }

  function equipped(value: boolean) {
    return value ? t('accommodations.equipped') : t('accommodations.notEquipped')
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('accommodations.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Building2} />}
      />
      <div className="space-y-4">
        <AccommodationYearAlert accommodation={item} />
        <FormCard
          icon={Building2}
          title={
            <span className="inline-flex flex-wrap items-center gap-2">
              {item.name}
              <StatusBadge status={item.status} />
            </span>
          }
          subtitle={t('accommodations.detailsSubtitle')}
          chips={
            <>
              {city ? <FormMetaChip icon={MapPin} label={city} /> : null}
              <FormMetaChip
                icon={Landmark}
                label={t(`accommodationTypes.${item.type}`)}
              />
              <FormMetaChip icon={Users} label={t(`genderTypes.${item.genderType}`)} />
              <FormMetaChip
                icon={Users}
                label={t('accommodations.peopleCount', { count: n(totalCapacity) })}
              />
              <FormMetaChip
                icon={UserCog}
                label={t('accommodations.contactsProgress', {
                  filled: n(filledContacts),
                  total: n(accommodationContactRoles.length),
                })}
              />
              {item.phone ? <FormMetaChip icon={Phone} copyValue={item.phone} /> : null}
            </>
          }
        >
          <div className="space-y-4 p-5 sm:p-6">
            <AccommodationTabNav tab={tab} tabs={[...accommodationTabs]} onChange={setTab} />

            <div data-tab="general" className={panelClass('general')}>
              <FormSectionTitle icon={Building2}>
                {t('accommodations.sectionGeneral')}
              </FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={Building2}
                  label={t('accommodations.name')}
                  value={item.name}
                  tone="teal"
                />
                <FormFactTile
                  icon={Landmark}
                  label={t('accommodations.type')}
                  value={t(`accommodationTypes.${item.type}`)}
                  tone="mint"
                />
                <FormFactTile
                  icon={BadgeCheck}
                  label={t('accommodations.status')}
                  value={t(`accommodationStatuses.${item.status}`)}
                  tone="ink"
                />
                <FormFactTile
                  icon={Users}
                  label={t('accommodations.genderType')}
                  value={t(`genderTypes.${item.genderType}`)}
                  tone="teal"
                />
                <FormFactTile
                  icon={BadgeCheck}
                  label={t('accommodations.managementType')}
                  value={t(`managementTypes.${item.managementType}`)}
                  tone="mint"
                />
                <FormFactTile
                  icon={Phone}
                  label={t('accommodations.phone')}
                  copyValue={item.phone}
                  empty={!item.phone}
                  tone="ink"
                />
                <FormFactTile
                  icon={AlignLeft}
                  label={t('accommodations.description')}
                  value={
                    item.description ? (
                      <span className="whitespace-pre-wrap">{item.description}</span>
                    ) : (
                      empty
                    )
                  }
                  empty={!item.description}
                  tone="teal"
                  className="sm:col-span-2"
                />
              </div>
            </div>

            <div data-tab="location" className={panelClass('location')}>
              <FormSectionTitle icon={MapPin}>
                {t('accommodations.sectionLocation')}
              </FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                <FormFactTile
                  icon={Flag}
                  label={t('geo.country')}
                  value={country || empty}
                  empty={!country}
                  tone="teal"
                />
                <FormFactTile
                  icon={MapPinned}
                  label={t('geo.province')}
                  value={province || empty}
                  empty={!province}
                  tone="mint"
                />
                <FormFactTile
                  icon={MapPin}
                  label={t('geo.city')}
                  value={city || empty}
                  empty={!city}
                  tone="ink"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={MapPin}
                  label={t('accommodations.address')}
                  value={item.address || empty}
                  empty={!item.address}
                  tone="teal"
                  className="sm:col-span-2"
                />
                <FormFactTile
                  icon={Navigation}
                  label={t('accommodations.neshanAddress')}
                  value={item.neshanAddress || empty}
                  empty={!item.neshanAddress}
                  tone="mint"
                  className="sm:col-span-2"
                />
                <FormFactTile
                  icon={Compass}
                  label={t('accommodations.latitude')}
                  value={item.latitude == null ? empty : n(item.latitude)}
                  empty={item.latitude == null}
                  tone="teal"
                />
                <FormFactTile
                  icon={Compass}
                  label={t('accommodations.longitude')}
                  value={item.longitude == null ? empty : n(item.longitude)}
                  empty={item.longitude == null}
                  tone="mint"
                />
              </div>
            </div>

            <div data-tab="capacity" className={panelClass('capacity')}>
              <FormSectionTitle icon={Users}>
                {t('accommodations.sectionCapacity')}
              </FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={Mars}
                  label={t('accommodations.maleCapacity')}
                  value={n(item.maleCapacity)}
                  tone="teal"
                />
                <FormFactTile
                  icon={Venus}
                  label={t('accommodations.femaleCapacity')}
                  value={n(item.femaleCapacity)}
                  tone="mint"
                />
                <FormFactTile
                  icon={UserCheck}
                  label={t('accommodations.assignedMaleCapacity')}
                  value={n(item.assignedMaleCapacity)}
                  tone="ink"
                />
                <FormFactTile
                  icon={UserCheck}
                  label={t('accommodations.assignedFemaleCapacity')}
                  value={n(item.assignedFemaleCapacity)}
                  tone="teal"
                />
                <FormFactTile
                  icon={Route}
                  label={t('accommodations.distanceToShrineKm')}
                  value={
                    item.distanceToShrineKm == null
                      ? empty
                      : `${n(item.distanceToShrineKm)} ${t('accommodations.km')}`
                  }
                  empty={item.distanceToShrineKm == null}
                  tone="mint"
                />
                <FormFactTile
                  icon={Route}
                  label={t('accommodations.distanceToMashhadKm')}
                  value={
                    item.distanceToMashhadKm == null
                      ? empty
                      : `${n(item.distanceToMashhadKm)} ${t('accommodations.km')}`
                  }
                  empty={item.distanceToMashhadKm == null}
                  tone="ink"
                />
              </div>
            </div>

            <div data-tab="amenities" className={panelClass('amenities')}>
              <FormSectionTitle icon={Shirt}>
                {t('accommodations.sectionAmenities')}
              </FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={Shirt}
                  label={t('accommodations.hasLaundry')}
                  value={equipped(item.hasLaundry)}
                  tone="teal"
                />
                <FormFactTile
                  icon={Wifi}
                  label={t('accommodations.hasInternet')}
                  value={equipped(item.hasInternet)}
                  tone="mint"
                />
                <FormFactTile
                  icon={BookOpen}
                  label={t('accommodations.hasPrayerRoom')}
                  value={equipped(item.hasPrayerRoom)}
                  tone="ink"
                />
                <FormFactTile
                  icon={ArrowUpDown}
                  label={t('accommodations.hasElevator')}
                  value={equipped(item.hasElevator)}
                  tone="teal"
                />
                <FormFactTile
                  icon={Flame}
                  label={t('accommodations.heatingSystem')}
                  value={item.heatingSystem || empty}
                  empty={!item.heatingSystem}
                  tone="mint"
                />
                <FormFactTile
                  icon={Snowflake}
                  label={t('accommodations.coolingSystem')}
                  value={item.coolingSystem || empty}
                  empty={!item.coolingSystem}
                  tone="ink"
                />
                <FormFactTile
                  icon={Car}
                  label={t('accommodations.parkingCapacity')}
                  value={item.parkingCapacity == null ? empty : n(item.parkingCapacity)}
                  empty={item.parkingCapacity == null}
                  tone="teal"
                />
                <FormFactTile
                  icon={Bath}
                  label={t('accommodations.bathroomCount')}
                  value={item.bathroomCount == null ? empty : n(item.bathroomCount)}
                  empty={item.bathroomCount == null}
                  tone="mint"
                />
                <FormFactTile
                  icon={Droplets}
                  label={t('accommodations.toiletCount')}
                  value={item.toiletCount == null ? empty : n(item.toiletCount)}
                  empty={item.toiletCount == null}
                  tone="ink"
                />
              </div>
            </div>

            <div data-tab="social" className={panelClass('social')}>
              <FormSectionTitle icon={Share2}>
                {t('accommodations.sectionSocial')}
              </FormSectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FormFactTile
                  icon={MessageCircle}
                  label={t('accommodations.eitaa')}
                  value={item.eitaa || empty}
                  empty={!item.eitaa}
                  tone="teal"
                />
                <FormFactTile
                  icon={MessageCircle}
                  label={t('accommodations.bale')}
                  value={item.bale || empty}
                  empty={!item.bale}
                  tone="mint"
                />
                <FormFactTile
                  icon={Share2}
                  label={t('accommodations.otherSocial')}
                  value={item.otherSocial || empty}
                  empty={!item.otherSocial}
                  tone="ink"
                  className="sm:col-span-2"
                />
              </div>
            </div>

            <div data-tab="contacts" className={panelClass('contacts')}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <FormSectionTitle icon={UserCog} className="mb-0">
                  {t('accommodations.sectionContacts')}
                </FormSectionTitle>
                <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
                  {t('accommodations.contactsProgress', {
                    filled: n(filledContacts),
                    total: n(accommodationContactRoles.length),
                  })}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {accommodationContactRoles.map((role) => {
                  const contact = item.contacts?.find((entry) => entry.role === role)
                  const Icon = roleIcons[role]
                  return (
                    <article
                      key={role}
                      className={`rounded-2xl border p-3.5 ${formToneClass.teal.wrap}`}
                    >
                      <div className="mb-2.5 flex items-center gap-2">
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${formToneClass.teal.icon}`}
                        >
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <p className="text-xs font-semibold text-teal-900">
                          {t(`accommodations.contactRoles.${role}`)}
                        </p>
                      </div>
                      {contact ? (
                        <div className="space-y-1.5 text-sm">
                          <p>
                            <PilgrimNameLink
                              id={contact.user.id || contact.userId}
                              name={
                                contact.user.fullName ||
                                `${contact.user.firstName} ${contact.user.lastName}`.trim()
                              }
                            />
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-ink-600">
                            <IdCard className="size-3.5 shrink-0 text-teal-600" aria-hidden />
                            <CopyableDigits value={contact.user.nationalId} empty={empty} />
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-ink-600">
                            <Phone className="size-3.5 shrink-0 text-teal-600" aria-hidden />
                            <CopyableDigits value={contact.user.phone} empty={empty} />
                          </p>
                          {contact.user.birthDate ? (
                            <p className="flex items-center gap-1.5 text-xs text-ink-600">
                              <Calendar className="size-3.5 shrink-0 text-teal-600" aria-hidden />
                              <DateText value={contact.user.birthDate} />
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-400">{t('accommodations.contactEmpty')}</p>
                      )}
                    </article>
                  )
                })}
              </div>
              {yearContacts.length ? (
                <div className="space-y-2.5">
                  <FormSectionTitle icon={Calendar}>
                    {t('accommodations.sectionYearContacts')}
                  </FormSectionTitle>
                  <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                    {yearContacts.map((contact) => (
                      <FormFactTile
                        key={contact.id}
                        icon={roleIcons[contact.role as AccommodationContactRole] ?? UserCog}
                        label={`${t(`accommodations.contactRoles.${contact.role}`)} — ${n(contact.year)}`}
                        value={
                          <PilgrimNameLink
                            id={contact.user.id || contact.userId}
                            name={
                              contact.user.fullName ||
                              `${contact.user.firstName} ${contact.user.lastName}`.trim()
                            }
                          />
                        }
                        tone="mint"
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div data-tab="managers" className={panelClass('managers')}>
              <FormSectionTitle icon={UserRound}>
                {t('accommodations.sectionManagers')}
              </FormSectionTitle>
              {managers.length ? (
                <div className="grid gap-2 sm:gap-3">
                  {managers.map((manager) => {
                    const display = managerDisplayName(
                      manager,
                      t('accommodations.unassignedManager'),
                    )
                    const current = manager.year === currentYear
                    return (
                      <article
                        key={manager.id}
                        className={`rounded-2xl border p-4 ${
                          current ? formToneClass.teal.wrap : formToneClass.ink.wrap
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
                              current ? formToneClass.teal.icon : formToneClass.ink.icon
                            }`}
                          >
                            {personInitials(display)}
                          </span>
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-semibold text-ink-900">{display}</p>
                              {manager.isPrimary ? (
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
                                  {t('accommodations.primaryManager')}
                                </span>
                              ) : null}
                            </div>
                            <FormFactTile
                              icon={Calendar}
                              label={t('accommodations.year')}
                              value={n(manager.year)}
                              tone={current ? 'teal' : 'ink'}
                              compact
                            />
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <FormEmptyHint>{t('accommodations.noManagers')}</FormEmptyHint>
              )}
            </div>
          </div>

          <div className="border-t border-line px-5 py-4 sm:px-6">
            <DetailActions
              className=""
              editTo={`${listPath}/${item.id}/edit`}
              editLabel={t('common.edit')}
              deleteLabel={t('accommodations.delete')}
              onDelete={() =>
                confirmDelete({
                  message: t('accommodations.confirmDelete'),
                  successMessage: t('accommodations.deleted'),
                  path: `/accommodations/${item.id}`,
                  queryKey: fromMine ? ['accommodations', 'mine'] : ['accommodations'],
                  onDeleted: () => navigate(listPath),
                })
              }
            />
          </div>
        </FormCard>
      </div>
    </div>
  )
}

function personInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : ''
  return `${first}${last}` || '؟'
}

function StatusBadge({ status }: { status: AccommodationStatus }) {
  const { t } = useTranslation()
  const active = status === 'ACTIVE'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
        active
          ? 'bg-teal-500 text-white ring-teal-500'
          : status === 'FULL'
            ? 'bg-mint-500 text-white ring-mint-500'
            : 'bg-white/80 text-ink-500 ring-line'
      }`}
    >
      {t(`accommodationStatuses.${status}`)}
    </span>
  )
}
