import {
  BadgeCheck,
  BookOpen,
  Building2,
  Calendar,
  ClipboardCheck,
  FileImage,
  Flag,
  History,
  IdCard,
  Landmark,
  MapPin,
  Mars,
  MessageCircle,
  Phone,
  Route,
  Share2,
  Shield,
  Tent,
  UserCog,
  UserRound,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { DateText } from '../../components/ui/DateText'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  DetailActions,
  PageHeader,
  cardClassName,
  formShellClassName,
} from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useAuth } from '../../auth/AuthProvider'
import { api, getImageUrl } from '../../lib/api'
import { currentPersianYear, formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import { isAdmin } from '../../lib/roles'
import type { Caravan } from '../../types/app'
import { caravanContactRoles, type CaravanContactRole } from './caravanContacts'
import { CaravanYearAlert } from './CaravanYearAlert'

type Tone = 'teal' | 'mint' | 'ink'

const toneClass: Record<Tone, { wrap: string; icon: string }> = {
  teal: {
    wrap: 'border-teal-100 bg-gradient-to-b from-teal-50 to-white',
    icon: 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]',
  },
  mint: {
    wrap: 'border-mint-100 bg-gradient-to-b from-mint-50 to-white',
    icon: 'bg-mint-500 text-white shadow-[0_8px_16px_rgba(95,191,122,0.24)]',
  },
  ink: {
    wrap: 'border-line bg-gradient-to-b from-cream-50 to-white',
    icon: 'bg-ink-700 text-white',
  },
}

const roleIcons: Record<CaravanContactRole, LucideIcon> = {
  DEPUTY: UserCog,
  CLERIC: BookOpen,
  CULTURAL: Landmark,
  SECURITY: Shield,
  RECEPTION: ClipboardCheck,
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
  const query = useQuery({
    queryKey: ['caravan', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Caravan>(`/caravans/${id}`)
      return data
    },
  })

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
  const filledContacts =
    caravan.contacts?.filter((item) =>
      caravanContactRoles.includes(item.role as CaravanContactRole),
    ).length ?? 0

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('caravans.details')}
        subtitle={<EntityNameSubtitle name={caravan.name} icon={Tent} />}
      />

      <div className="space-y-4">
      <CaravanYearAlert caravan={caravan} />

      <section className={`${cardClassName} overflow-hidden`}>
        <header className="relative overflow-hidden bg-gradient-to-l from-mint-50 via-white to-teal-50 px-5 py-5 sm:px-6">
          <div
            className="pointer-events-none absolute -start-8 -top-10 size-32 rounded-full bg-teal-200/30"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -end-6 -bottom-12 size-28 rounded-full bg-mint-100/70"
            aria-hidden
          />
          <div className="relative flex items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
              <Tent className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink-900">{caravan.name}</h2>
                <StatusBadge active={caravan.isActive} />
              </div>
              <p className="mt-1 text-xs leading-6 text-ink-600">
                {t('caravans.detailsSubtitle')}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {city ? (
                  <MetaChip icon={MapPin} label={city} />
                ) : null}
                <MetaChip
                  icon={Users}
                  label={t('caravans.peopleCount', { count: n(caravan.totalCount) })}
                />
                <MetaChip
                  icon={UserCog}
                  label={t('caravans.contactsProgress', {
                    filled: n(filledContacts),
                    total: n(caravanContactRoles.length),
                  })}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <SectionTitle icon={Users}>{t('caravans.sectionCounts')}</SectionTitle>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <MetricTile
                icon={Mars}
                label={t('caravans.maleCount')}
                value={n(caravan.maleCount)}
                unit={t('caravans.people')}
                tone="teal"
              />
              <MetricTile
                icon={Venus}
                label={t('caravans.femaleCount')}
                value={n(caravan.femaleCount)}
                unit={t('caravans.people')}
                tone="mint"
              />
              <MetricTile
                icon={Users}
                label={t('caravans.totalCount')}
                value={n(caravan.totalCount)}
                unit={t('caravans.people')}
                tone="ink"
              />
            </div>
          </section>

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
            <div className="mt-2 sm:mt-3">
              <FactTile
                icon={Route}
                label={t('caravans.walkingRoute')}
                value={caravan.walkingRoute?.name || empty}
                empty={!caravan.walkingRoute}
                tone="teal"
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

          <section>
            <SectionTitle icon={Calendar}>{t('caravans.sectionYears')}</SectionTitle>
            {caravan.years?.length ? (
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {[...caravan.years]
                  .sort((a, b) => b.year - a.year)
                  .map((row) => (
                    <FactTile
                      key={row.id}
                      icon={row.manager ? UserRound : Calendar}
                      label={n(row.year)}
                      value={
                        row.manager?.fullName || t('caravans.unassignedManager')
                      }
                      tone={row.year === currentPersianYear() ? 'teal' : 'ink'}
                    />
                  ))}
              </div>
            ) : (
              <EmptyHint>{t('caravans.noActivityYears')}</EmptyHint>
            )}
          </section>

          <section>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <SectionTitle icon={UserCog} className="mb-0">
                {t('caravans.sectionContacts')}
              </SectionTitle>
              <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-800">
                {t('caravans.contactsProgress', {
                  filled: n(filledContacts),
                  total: n(caravanContactRoles.length),
                })}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              {caravanContactRoles.map((role) => {
                const contact = caravan.contacts?.find((item) => item.role === role)
                const Icon = roleIcons[role]
                return (
                  <article
                    key={role}
                    className="rounded-2xl border border-teal-100 bg-gradient-to-b from-white to-teal-50/40 p-3.5"
                  >
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-[0_6px_14px_rgba(46,189,182,0.24)]">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <p className="text-xs font-semibold text-teal-900">
                        {t(`caravans.contactRoles.${role}`)}
                      </p>
                    </div>
                    {contact ? (
                      <div className="space-y-1.5 text-sm">
                        <p className="font-semibold text-ink-900">
                          {contact.user.fullName ||
                            `${contact.user.firstName} ${contact.user.lastName}`.trim()}
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
                      <p className="text-xs text-ink-400">{t('caravans.contactEmpty')}</p>
                    )}
                  </article>
                )
              })}
            </div>
          </section>

          <section>
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
              />
              <FactTile
                icon={FileImage}
                label={t('caravans.licenseImage')}
                value={
                  caravan.licenseImageId ? (
                    <a
                      href={getImageUrl(caravan.licenseImageId)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline"
                    >
                      {t('common.view')}
                    </a>
                  ) : (
                    empty
                  )
                }
                empty={!caravan.licenseImageId}
                tone="mint"
              />
            </div>
          </section>

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
              {caravan.description ? (
                <FactTile
                  icon={Tent}
                  label={t('caravans.description')}
                  value={
                    <span className="whitespace-pre-wrap">{caravan.description}</span>
                  }
                  tone="teal"
                  className="sm:col-span-2"
                />
              ) : null}
            </div>
          </section>

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

function StatusBadge({ active }: { active: boolean }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${
        active
          ? 'bg-teal-500 text-white ring-teal-500'
          : 'bg-white/80 text-ink-500 ring-line'
      }`}
    >
      {active ? t('geo.active') : t('geo.inactive')}
    </span>
  )
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

function MetricTile({
  icon: Icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit: string
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article
      className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center ${colors.wrap}`}
    >
      <span
        className={`flex size-9 items-center justify-center rounded-xl ${colors.icon}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="text-[11px] font-medium text-ink-500">{label}</p>
      <p className="text-lg font-bold leading-none text-ink-900">{value}</p>
      <p className="text-[10px] text-ink-400">{unit}</p>
    </article>
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
