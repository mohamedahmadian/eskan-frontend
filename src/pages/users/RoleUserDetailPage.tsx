import {
  Building2,
  Building,
  Calendar,
  Car,
  FileBadge2,
  FileImage,
  FileText,
  Flag,
  History,
  IdCard,
  ImagePlus,
  KeyRound,
  Languages,
  LayoutGrid,
  LocateFixed,
  Mail,
  Map,
  MapPin,
  MapPinned,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  Share2,
  Shield,
  Tent,
  ToggleRight,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  Button,
  EntityNameSubtitle,
  LoadingState,
  DetailActions,
  PageHeader,
  cardClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import { DateText } from '../../components/ui/DateText'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { EntityRowActions, TableCard } from '../../components/ui/ListControls'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { toast } from 'sonner'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { FormCard } from '../../components/ui/FormLayout'
import { collaborationYears, currentPersianYear, formatNumber, localizeDigits } from '../../lib/datetime'
import { publicProfilePath } from '../../lib/public-profile'
import { formatRoles, isAdmin } from '../../lib/roles'
import { useGeoName } from '../../lib/geo'
import type { ManagedUser } from '../../types/app'
import { HeadquartersAreasCard } from '../headquarters-representatives/HeadquartersAreasCard'
import { showUserActivityStartYear, type RoleUserScope } from './user-scopes'
import { RoleUserProfileHeader } from './RoleUserProfileHeader'
import { SetUserPasswordModal } from './SetUserPasswordModal'
import { OpenUserPanelButton } from '../../components/auth/OpenUserPanelButton'

const baseTabs = ['personal', 'account', 'location', 'documents', 'social', 'other'] as const
type UserDetailTab = (typeof baseTabs)[number] | 'accommodations' | 'caravans' | 'areas'

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

const tabIcons: Record<UserDetailTab, LucideIcon> = {
  personal: UserRound,
  account: KeyRound,
  location: MapPin,
  documents: ImagePlus,
  social: Share2,
  other: FileText,
  accommodations: Building2,
  caravans: Tent,
  areas: Map,
}

export function RoleUserDetailPage({ scope }: { scope: RoleUserScope }) {
  const { t, i18n } = useTranslation()
  const uiLocale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: actor } = useAuth()
  const geoName = useGeoName()
  const { confirmDelete } = useConfirmDelete()
  const keys = scope.i18nPrefix
  const [tab, setTab] = useState<UserDetailTab>('personal')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const query = useQuery({
    queryKey: [scope.queryKey, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<ManagedUser>(`${scope.apiBase}/${id}`)
      return data
    },
  })

  const tabs = useMemo(() => {
    const items: UserDetailTab[] = [...baseTabs]
    if (scope.showCaravans) items.splice(1, 0, 'caravans')
    if (scope.showAccommodations) items.push('accommodations')
    if (scope.showHeadquartersAreas) items.push('areas')
    return items
  }, [scope.showCaravans, scope.showAccommodations, scope.showHeadquartersAreas])

  if (!query.data) {
    return <LoadingState />
  }
  const user = query.data

  const isSelf = actor?.id === user.id
  const hideRoles = Boolean(scope.hideRoles) && !isAdmin(actor)
  const locale = user.locale as AppLanguage
  const empty = '—'
  const religionLabel = user.religion
    ? user.religion === 'OTHER' && user.religionOther
      ? `${t(`religions.${user.religion}`)} (${user.religionOther})`
      : t(`religions.${user.religion}`)
    : empty
  const cityLabel = user.city ? geoName(user.city) : ''
  const rolesLabel = formatRoles(user.roles, t)
  const showActivityStart = showUserActivityStartYear(keys, {
    lockedRoleCodes: scope.lockedRoleCodes,
    roleCodes: user.roles.map((role) => role.code),
  })
  const yearsOfCollaboration = collaborationYears(user.activityStartYear)

  async function submitUserPassword(password: string) {
    if (!user.phone) {
      toast.error(t('users.phoneRequiredForSms'))
      return
    }
    setPasswordSaving(true)
    try {
      await api.patch(`/users/${user.id}/password`, { password })
      toast.success(t('users.passwordChangedSmsSent'))
      setPasswordModalOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className={userFormShellClassName}>
      {passwordModalOpen ? (
        <SetUserPasswordModal
          submitting={passwordSaving}
          onClose={() => {
            if (!passwordSaving) setPasswordModalOpen(false)
          }}
          onSubmit={submitUserPassword}
        />
      ) : null}
      <PageHeader
        title={t(`${keys}.details`)}
        subtitle={<EntityNameSubtitle name={user.fullName} icon={UserRound} />}
      />

      <section className={`${cardClassName} overflow-hidden`}>
        <RoleUserProfileHeader
          user={user}
          hideRoles={scope.hideRoles}
          action={<OpenUserPanelButton userId={user.id} status={user.status} />}
        />

        <nav className="flex flex-wrap gap-2 border-b border-line bg-cream-50/60 px-4 py-3 sm:px-5">
          {tabs.map((item) => {
            const Icon = tabIcons[item]
            const active = tab === item
            return (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]'
                    : 'bg-white text-ink-700 ring-1 ring-line hover:bg-cream-50'
                }`}
              >
                <Icon className={`size-3.5 ${active ? 'text-white' : 'text-teal-600'}`} aria-hidden />
                {t(`users.tabs.${item}`)}
              </button>
            )
          })}
        </nav>

        <div className="space-y-6 p-5 sm:p-6">
          {tab === 'personal' ? (
            <section>
              <SectionTitle icon={UserRound}>{t('users.tabs.personal')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={UserRound}
                  label={t('users.firstName')}
                  value={user.firstName}
                  tone="teal"
                />
                <FactTile
                  icon={UserRound}
                  label={t('users.lastName')}
                  value={user.lastName}
                  tone="mint"
                />
                <FactTile
                  icon={UserRound}
                  label={t('users.gender')}
                  value={user.gender ? t(`userGenders.${user.gender}`) : empty}
                  empty={!user.gender}
                  tone="ink"
                />
                <FactTile
                  icon={IdCard}
                  label={t('users.nationalId')}
                  value={<CopyableDigits value={user.nationalId} empty={empty} />}
                  empty={!user.nationalId}
                  tone="teal"
                />
                <FactTile
                  icon={Phone}
                  label={t('users.phone')}
                  value={<CopyableDigits value={user.phone} empty={empty} />}
                  empty={!user.phone}
                  tone="mint"
                />
                <FactTile
                  icon={Shield}
                  label={t('users.religion')}
                  value={religionLabel}
                  empty={!user.religion}
                  tone="ink"
                />
                {showActivityStart ? (
                  <FactTile
                    icon={Calendar}
                    label={t('users.activityStartYear')}
                    value={
                      user.activityStartYear != null
                        ? formatNumber(user.activityStartYear, uiLocale)
                        : empty
                    }
                    empty={user.activityStartYear == null}
                    hint={
                      yearsOfCollaboration != null
                        ? t('users.collaborationYears', {
                            years: formatNumber(yearsOfCollaboration, uiLocale),
                          })
                        : undefined
                    }
                    tone="teal"
                  />
                ) : null}
              </div>
            </section>
          ) : null}

          {scope.showCaravans && tab === 'caravans' ? (
            <section>
              <SectionTitle icon={Tent}>{t('users.tabs.caravans')}</SectionTitle>
              <TableCard
                empty={t('caravanManagers.noCaravans')}
                hasRows={Boolean(user.caravans?.length)}
              >
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('caravans.name')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('caravans.city')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('caravans.status')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('caravans.totalCount')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(user.caravans ?? []).map((caravan) => (
                      <tr key={caravan.id} className="border-t border-line">
                        <td className="px-4 py-3">{caravan.name}</td>
                        <td className="px-4 py-3">
                          {caravan.city ? geoName(caravan.city) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {caravan.isActive ? t('geo.active') : t('geo.inactive')}
                        </td>
                        <td className="px-4 py-3">
                          {t('caravans.peopleCount', {
                            count: formatNumber(caravan.totalCount ?? 0, uiLocale),
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <EntityRowActions
                            viewTo={`/caravans/${caravan.id}`}
                            extra={
                              <Link to={`/caravans/${caravan.id}/pilgrimage-history`}>
                                <Button type="button" variant="soft">
                                  <History className="size-4" aria-hidden />
                                  {t('caravanPilgrimageHistory.open')}
                                </Button>
                              </Link>
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            </section>
          ) : null}

          {tab === 'account' ? (
            <section>
              <SectionTitle icon={KeyRound}>{t('users.tabs.account')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={UserRound}
                  label={t('users.username')}
                  value={localizeDigits(user.username, uiLocale)}
                  tone="teal"
                />
                {hideRoles ? null : (
                  <FactTile
                    icon={Shield}
                    label={t('users.roles')}
                    value={rolesLabel || empty}
                    empty={!rolesLabel}
                    tone="mint"
                  />
                )}
                {user.issuingOrganization ? (
                  <FactTile
                    icon={Building}
                    label={
                      user.roles?.some((role) => role.code === 'GOVERNMENT_ORG_OFFICER')
                        ? t('users.linkedOrganization')
                        : t('users.issuingOrganization')
                    }
                    value={user.issuingOrganization.name}
                    tone="ink"
                  />
                ) : null}
                <FactTile
                  icon={Languages}
                  label={t('users.locale')}
                  value={languages[locale] ? t(`languages.${locale}`) : user.locale}
                  tone="teal"
                />
                <FactTile
                  icon={Calendar}
                  label={t('users.createdAt')}
                  value={<DateText value={user.createdAt} withTime />}
                  tone="mint"
                />
                <FactTile
                  icon={Calendar}
                  label={t('users.updatedAt')}
                  value={<DateText value={user.updatedAt} withTime />}
                  tone="ink"
                />
              </div>
            </section>
          ) : null}

          {tab === 'location' ? (
            <section>
              <SectionTitle icon={MapPin}>{t('users.tabs.location')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={Flag}
                  label={t('geo.country')}
                  value={user.country ? geoName(user.country) : empty}
                  empty={!user.country}
                  tone="teal"
                />
                <FactTile
                  icon={MapPin}
                  label={t('geo.province')}
                  value={user.province ? geoName(user.province) : empty}
                  empty={!user.province}
                  tone="mint"
                />
                <FactTile
                  icon={Building2}
                  label={t('geo.city')}
                  value={cityLabel || empty}
                  empty={!cityLabel}
                  tone="ink"
                />
                <FactTile
                  icon={MapPinned}
                  label={t('users.address')}
                  value={user.address || empty}
                  empty={!user.address}
                  tone="teal"
                  className="sm:col-span-2"
                />
              </div>
              <SectionTitle icon={LocateFixed} className="mb-2.5 mt-6">
                {t('location.title')}
              </SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={MapPinned}
                  label={t('geo.province')}
                  value={user.locationProvince ? geoName(user.locationProvince) : empty}
                  empty={!user.locationProvince}
                  tone="teal"
                />
                <FactTile
                  icon={Building2}
                  label={t('geo.city')}
                  value={user.locationCity ? geoName(user.locationCity) : empty}
                  empty={!user.locationCity}
                  tone="mint"
                />
                <FactTile
                  icon={MapPinned}
                  label={t('location.notes')}
                  value={user.locationNotes || empty}
                  empty={!user.locationNotes}
                  tone="ink"
                  className="sm:col-span-2"
                />
              </div>
              {user.latitude != null && user.longitude != null ? (
                <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-teal-100">
                  <OsmMapPicker
                    variant="always"
                    readOnly
                    latitude={String(user.latitude)}
                    longitude={String(user.longitude)}
                    onChange={() => undefined}
                    heightClass="h-56"
                  />
                </div>
              ) : null}
              {user.locationUpdatedAt ? (
                <p className="mt-2 text-xs text-ink-400">
                  {t('location.updatedAt')}
                  {' · '}
                  <DateText value={user.locationUpdatedAt} withTime />
                </p>
              ) : null}
            </section>
          ) : null}

          {tab === 'documents' ? (
            <section>
              <SectionTitle icon={ImagePlus}>{t('users.tabs.documents')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                <DocumentTile
                  icon={UserRound}
                  label={t('users.photo')}
                  imageId={user.photoId}
                  tone="teal"
                />
                <DocumentTile
                  icon={IdCard}
                  label={t('users.nationalCardPhoto')}
                  imageId={user.nationalCardPhotoId}
                  tone="mint"
                />
                <DocumentTile
                  icon={FileImage}
                  label={t('users.passportPhoto')}
                  imageId={user.passportPhotoId}
                  tone="ink"
                />
              </div>
            </section>
          ) : null}

          {tab === 'social' ? (
            <section>
              <SectionTitle icon={Share2}>{t('users.tabs.social')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={Share2}
                  label={t('users.telegram')}
                  value={user.telegram || empty}
                  empty={!user.telegram}
                  tone="teal"
                />
                <FactTile
                  icon={MessageCircle}
                  label={t('users.bale')}
                  value={user.bale || empty}
                  empty={!user.bale}
                  tone="mint"
                />
                <FactTile
                  icon={MessageCircle}
                  label={t('users.eitaa')}
                  value={user.eitaa || empty}
                  empty={!user.eitaa}
                  tone="ink"
                />
                <FactTile
                  icon={Phone}
                  label={t('users.whatsapp')}
                  value={user.whatsapp || empty}
                  empty={!user.whatsapp}
                  tone="teal"
                />
                <FactTile
                  icon={Share2}
                  label={t('users.otherSocial')}
                  value={user.otherSocial || empty}
                  empty={!user.otherSocial}
                  tone="mint"
                  className="sm:col-span-2"
                />
              </div>
            </section>
          ) : null}

          {tab === 'other' ? (
            <section>
              <SectionTitle icon={FileText}>{t('users.tabs.other')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={Mail}
                  label={t('users.email')}
                  value={user.email || empty}
                  empty={!user.email}
                  tone="teal"
                />
                <FactTile
                  icon={ToggleRight}
                  label={t('users.status')}
                  value={t(`userStatuses.${user.status}`)}
                  tone="mint"
                />
                <FactTile
                  icon={Car}
                  label={t('users.vehiclePlates')}
                  value={user.vehiclePlates.length ? user.vehiclePlates.join('، ') : empty}
                  empty={!user.vehiclePlates.length}
                  tone="ink"
                  className="sm:col-span-2"
                />
                <FactTile
                  icon={FileText}
                  label={t('users.notes')}
                  value={
                    user.notes ? (
                      <span className="whitespace-pre-wrap">{user.notes}</span>
                    ) : (
                      empty
                    )
                  }
                  empty={!user.notes}
                  tone="teal"
                  className="sm:col-span-2"
                />
              </div>
            </section>
          ) : null}

          {scope.showAccommodations && tab === 'accommodations' ? (
            <section>
              <SectionTitle icon={Building2}>{t('users.tabs.accommodations')}</SectionTitle>
              <TableCard
                empty={t('accommodationManagers.noAccommodations')}
                hasRows={Boolean(user.accommodations?.length)}
              >
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">
                        {t('accommodationManagers.year')}
                      </th>
                      <th className="px-4 py-3 text-start font-medium">{t('accommodations.name')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(user.accommodations ?? [])]
                      .sort((a, b) => (b.year !== a.year ? b.year - a.year : 0))
                      .map((item) => (
                        <tr key={item.id} className="border-t border-line">
                          <td className="px-4 py-3">{formatNumber(item.year, uiLocale)}</td>
                          <td className="px-4 py-3">
                            <Link
                              className="text-teal-700 hover:underline"
                              to={`/accommodations/${item.accommodation.id}`}
                            >
                              {item.accommodation.name}
                            </Link>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </TableCard>
            </section>
          ) : null}

          {scope.showHeadquartersAreas && tab === 'areas' ? (
            <section>
              <SectionTitle icon={Map}>{t('users.tabs.areas')}</SectionTitle>
              <HeadquartersAreasCard user={user} queryKey={scope.queryKey} apiBase={scope.apiBase} />
            </section>
          ) : null}
        </div>

        <div className="border-t border-line px-5 py-4 sm:px-6">
          <DetailActions
            className=""
            editTo={`${scope.listPath}/${user.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={
              isSelf || scope.hideDelete || scope.i18nPrefix === 'pilgrims'
                ? undefined
                : t(`${keys}.delete`)
            }
            onDelete={
              isSelf || scope.hideDelete || scope.i18nPrefix === 'pilgrims'
                ? undefined
                : () =>
                    confirmDelete({
                      message: t(`${keys}.confirmDelete`),
                      successMessage: t(`${keys}.deleted`),
                      path: `${scope.apiBase}/${user.id}`,
                      queryKey: [scope.queryKey],
                      onDeleted: () => navigate(scope.listPath),
                    })
            }
            extra={
              scope.showPilgrimCard ? (
                <Link to={publicProfilePath(user.id)}>
                  <Button type="button" variant="soft">
                    <IdCard className="size-4" aria-hidden />
                    {t('publicProfile.openPage')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to={publicProfilePath(user.id)}>
                    <Button type="button" variant="soft">
                      <IdCard className="size-4" aria-hidden />
                      {t('publicProfile.openPage')}
                    </Button>
                  </Link>
                  <Link to={`${scope.listPath}/${user.id}/location`}>
                    <Button type="button" variant="soft">
                      <MapPinned className="size-4" aria-hidden />
                      {t('location.register')}
                    </Button>
                  </Link>
                  {scope.i18nPrefix === 'users' ? (
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => {
                        if (!user.phone) {
                          toast.error(t('users.phoneRequiredForSms'))
                          return
                        }
                        setPasswordModalOpen(true)
                      }}
                    >
                      <Send className="size-4" aria-hidden />
                      {t('users.forgotPassword')}
                    </Button>
                  ) : null}
                </>
              )
            }
          />
        </div>
      </section>
      {scope.showPilgrimCard ? (
        <PilgrimOperationsBox userId={user.id} listPath={scope.listPath} />
      ) : null}
    </div>
  )
}

function PilgrimOperationsBox({ userId, listPath }: { userId: string; listPath: string }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const year = formatNumber(currentPersianYear(), locale)
  const base = `${listPath}/${userId}`

  return (
    <FormCard
      className="mt-4"
      icon={LayoutGrid}
      title={t('pilgrims.operations')}
      subtitle={t('pilgrims.operationsSubtitle')}
    >
      <div className="flex flex-wrap gap-2.5 p-4 sm:p-5">
        <Link to={`/reservations/new?forUser=${encodeURIComponent(userId)}`}>
          <Button type="button">
            <FileBadge2 className="size-4" aria-hidden />
            {t('reservations.createYear', { year })}
          </Button>
        </Link>
        <Link to={`${base}/sms`}>
          <Button type="button" variant="soft">
            <MessageSquare className="size-4" aria-hidden />
            {t('pilgrims.sendSms')}
          </Button>
        </Link>
        <Link to={`${base}/password`}>
          <Button type="button" variant="soft">
            <KeyRound className="size-4" aria-hidden />
            {t('pilgrims.setPassword')}
          </Button>
        </Link>
        <Link to={`${base}/card`}>
          <Button type="button" variant="soft">
            <IdCard className="size-4" aria-hidden />
            {t('pilgrims.card')}
          </Button>
        </Link>
        <Link to={publicProfilePath(userId)}>
          <Button type="button" variant="soft">
            <IdCard className="size-4" aria-hidden />
            {t('publicProfile.openPage')}
          </Button>
        </Link>
        <Link to={`${base}/location`}>
          <Button type="button" variant="soft">
            <MapPinned className="size-4" aria-hidden />
            {t('location.register')}
          </Button>
        </Link>
        <Link to={`${base}/pilgrimage-history`}>
          <Button type="button" variant="soft">
            <History className="size-4" aria-hidden />
            {t('pilgrims.pilgrimageHistory')}
          </Button>
        </Link>
      </div>
    </FormCard>
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
  hint,
  tone,
  className = '',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  empty?: boolean
  hint?: ReactNode
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
        {hint ? <p className="mt-1 text-xs font-medium text-ink-500">{hint}</p> : null}
      </div>
    </article>
  )
}

function DocumentTile({
  icon: Icon,
  label,
  imageId,
  tone,
}: {
  icon: LucideIcon
  label: string
  imageId?: string | null
  tone: Tone
}) {
  const colors = toneClass[tone]
  return (
    <article className={`rounded-2xl border px-3 py-3 ${colors.wrap}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colors.icon}`}
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <p className="text-xs font-semibold text-ink-700">{label}</p>
      </div>
      {imageId ? (
        <a href={getImageUrl(imageId)} target="_blank" rel="noreferrer">
          <img
            src={getImageUrl(imageId)}
            alt=""
            className="h-28 w-full rounded-xl object-cover ring-1 ring-white/80"
          />
        </a>
      ) : (
        <p className="rounded-xl border border-dashed border-line bg-white/70 px-3 py-8 text-center text-xs text-ink-400">
          —
        </p>
      )}
    </article>
  )
}
