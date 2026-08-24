import {
  Building2,
  Building,
  Calendar,
  Car,
  FileImage,
  FileText,
  Flag,
  IdCard,
  ImagePlus,
  KeyRound,
  Languages,
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
import { TableCard } from '../../components/ui/ListControls'
import { confirmToast } from '../../components/ui/confirmToast'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { languages, type AppLanguage } from '../../i18n'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { toast } from 'sonner'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { formatRoles } from '../../lib/roles'
import { useGeoName } from '../../lib/geo'
import type { ManagedUser } from '../../types/app'
import { HeadquartersAreasCard } from '../headquarters-representatives/HeadquartersAreasCard'
import type { RoleUserScope } from './user-scopes'
import { SetUserPasswordModal } from './SetUserPasswordModal'

const baseTabs = ['personal', 'account', 'location', 'documents', 'social', 'other'] as const
type UserDetailTab = (typeof baseTabs)[number] | 'accommodations' | 'areas'

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

const tabIcons: Record<UserDetailTab, LucideIcon> = {
  personal: UserRound,
  account: KeyRound,
  location: MapPin,
  documents: ImagePlus,
  social: Share2,
  other: FileText,
  accommodations: Building2,
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
    if (scope.showAccommodations) items.push('accommodations')
    if (scope.showHeadquartersAreas) items.push('areas')
    return items
  }, [scope.showAccommodations, scope.showHeadquartersAreas])

  if (!query.data) {
    return <LoadingState />
  }
  const user = query.data

  const isSelf = actor?.id === user.id
  const locale = user.locale as AppLanguage
  const empty = '—'
  const religionLabel = user.religion
    ? user.religion === 'OTHER' && user.religionOther
      ? `${t(`religions.${user.religion}`)} (${user.religionOther})`
      : t(`religions.${user.religion}`)
    : empty
  const cityLabel = user.city ? geoName(user.city) : ''
  const rolesLabel = formatRoles(user.roles, t)
  const isActive = user.status === 'ACTIVE'

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
            <UserAvatar user={user} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-ink-900">{user.fullName}</h2>
                <StatusBadge active={isActive} />
              </div>
              <p className="mt-1 text-xs leading-6 text-ink-600" dir="ltr">
                @{user.username}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.nationalId ? (
                  <MetaChip
                    icon={IdCard}
                    label={localizeDigits(user.nationalId, uiLocale)}
                  />
                ) : null}
                {user.phone ? (
                  <MetaChip icon={Phone} label={localizeDigits(user.phone, uiLocale)} />
                ) : null}
                {cityLabel ? <MetaChip icon={MapPin} label={cityLabel} /> : null}
                {!scope.hideRoles && rolesLabel ? (
                  <MetaChip icon={Shield} label={rolesLabel} />
                ) : null}
              </div>
            </div>
          </div>
        </header>

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
                  value={
                    user.nationalId ? localizeDigits(user.nationalId, uiLocale) : empty
                  }
                  empty={!user.nationalId}
                  tone="teal"
                />
                <FactTile
                  icon={Phone}
                  label={t('users.phone')}
                  value={user.phone ? localizeDigits(user.phone, uiLocale) : empty}
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
              </div>
            </section>
          ) : null}

          {tab === 'account' ? (
            <section>
              <SectionTitle icon={KeyRound}>{t('users.tabs.account')}</SectionTitle>
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                <FactTile
                  icon={UserRound}
                  label={t('users.username')}
                  value={<span dir="ltr">{user.username}</span>}
                  tone="teal"
                />
                {scope.hideRoles ? null : (
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
                    label={t('users.issuingOrganization')}
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
            deleteLabel={isSelf ? undefined : t(`${keys}.delete`)}
            onDelete={
              isSelf
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
              scope.showPilgrimCard || scope.i18nPrefix === 'users' ? (
                <>
                  {scope.showPilgrimCard ? (
                    <>
                      <Link to={`${scope.listPath}/${user.id}/sms`}>
                        <Button type="button" variant="soft">
                          <MessageSquare className="size-4" aria-hidden />
                          {t('pilgrims.sendSms')}
                        </Button>
                      </Link>
                      <Link to={`${scope.listPath}/${user.id}/password`}>
                        <Button type="button" variant="soft">
                          <KeyRound className="size-4" aria-hidden />
                          {t('pilgrims.setPassword')}
                        </Button>
                      </Link>
                      <Link to={`${scope.listPath}/${user.id}/card`}>
                        <Button type="button" variant="soft">
                          <IdCard className="size-4" aria-hidden />
                          {t('pilgrims.card')}
                        </Button>
                      </Link>
                    </>
                  ) : null}
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
                  ) : (
                    <Button
                      type="button"
                      variant="soft"
                      onClick={() => {
                        if (!user.phone) {
                          toast.error(t('pilgrims.phoneRequiredForSms'))
                          return
                        }
                        confirmToast({
                          title: t('pilgrims.forgotPasswordConfirm'),
                          confirmLabel: t('common.yes'),
                          cancelLabel: t('common.cancel'),
                          onConfirm: async () => {
                            try {
                              await api.post(`${scope.apiBase}/${user.id}/password/recover`)
                              toast.success(t('pilgrims.forgotPasswordSent'))
                            } catch (error) {
                              toast.error(getApiErrorMessage(error, t('common.error')))
                            }
                          },
                        })
                      }}
                    >
                      <Send className="size-4" aria-hidden />
                      {t('pilgrims.forgotPassword')}
                    </Button>
                  )}
                </>
              ) : undefined
            }
          />
        </div>
      </section>
    </div>
  )
}

function UserAvatar({ user }: { user: ManagedUser }) {
  if (user.photoId) {
    return (
      <img
        src={getImageUrl(user.photoId)}
        alt=""
        className="size-12 shrink-0 rounded-2xl object-cover shadow-[0_10px_22px_rgba(46,189,182,0.32)] ring-2 ring-white"
      />
    )
  }
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-sm font-bold text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
      {personInitials(user.firstName, user.lastName)}
    </span>
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
      {active ? t('userStatuses.ACTIVE') : t('userStatuses.INACTIVE')}
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
