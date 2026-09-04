import {
  Building2,
  CalendarRange,
  ExternalLink,
  Footprints,
  History,
  IdCard,
  HandHeart,
  Mail,
  MapPin,
  Mars,
  Phone,
  Plus,
  Search,
  Tent,
  UserRound,
  Users,
  Venus,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useNavigationType, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useQuickTools } from '../../components/layout/quick-tools-context'
import { DateText } from '../../components/ui/DateText'
import { AppForm, Button, cardClassName, LoadingState } from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import {
  parseClipboardReceptionQuery,
  readClipboardText,
} from '../../lib/clipboard'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type {
  ReceptionHousingRow,
  ReceptionPerson,
  ReceptionProfile,
  ReceptionRecord,
  ReceptionSearchResult,
  ReceptionSearchScope,
  ReceptionVisit,
} from '../../types/app'
import { ReceptionKindChips } from './ReceptionKindChips'
import { ReceptionMatchModal } from './ReceptionMatchModal'
import { OpenUserPanelButton } from '../../components/auth/OpenUserPanelButton'
import {
  ReservationStatusBadge,
  ReservationTypeBadge,
} from '../reservations/ReservationStatusBadge'
import {
  isReservationCodeQuery,
  normalizeReservationCode,
  ReservationCodeBadge,
} from '../reservations/ReservationCodeBadge'

type ReceptionPageCache = {
  term: string
  searched: boolean
  records: ReceptionRecord[] | null
  matchTotal: number
  resultPage: number
  resultPageSize: number
  profile: ReceptionProfile | null
  scope: ReceptionSearchScope
}

const SEARCH_PAGE_SIZE = 20

let receptionPageCache: ReceptionPageCache | null = null

function recordsFromResult(data: ReceptionSearchResult): ReceptionRecord[] {
  if (data.records?.length) return data.records
  return data.matches.map((item) => ({
    type: 'person' as const,
    id: item.id,
    title: item.fullName,
    phone: item.phone,
    nationalId: item.nationalId,
    city: item.city ?? null,
    person: item,
  }))
}

function pathForRecord(record: ReceptionRecord) {
  if (record.type === 'reservation') return `/reservations/${record.id}`
  if (record.type === 'accommodation') return `/accommodations/${record.id}`
  if (record.type === 'walkingStation') return `/base-info/walking-stations/${record.id}`
  if (record.type === 'caravan') return `/caravans/${record.id}`
  return `/base-info/benefactors/${record.id}`
}

function mergeSearchRecords(primary: ReceptionRecord[], extra: ReceptionRecord[]) {
  const seenPeople = new Set(
    primary.filter((item) => item.type === 'person').map((item) => item.id),
  )
  const seenKeys = new Set(primary.map((item) => `${item.type}:${item.id}`))
  const uniqueExtra = extra.filter((item) => {
    if (item.type === 'person' && seenPeople.has(item.id)) return false
    return !seenKeys.has(`${item.type}:${item.id}`)
  })
  return [...primary, ...uniqueExtra]
}

export function ReceptionDesk({
  variant = 'page',
  onExpandedChange,
  onNavigateAway,
}: {
  variant?: 'page' | 'modal'
  onExpandedChange?: (expanded: boolean) => void
  onNavigateAway?: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const navigate = useNavigate()
  const nameOf = useGeoName()
  const tools = useQuickTools()
  const navType = useNavigationType()
  const [searchParams] = useSearchParams()
  const searchRef = useRef<HTMLInputElement>(null)
  const autoQRef = useRef<string | null>(null)
  const searchInputId = variant === 'modal' ? 'reception-search-modal' : 'reception-search'
  const qParam = variant === 'page' ? searchParams.get('q')?.trim() ?? '' : ''
  const cached =
    variant === 'page' && navType === 'POP' && !qParam ? receptionPageCache : null
  const [term, setTerm] = useState(qParam || (cached?.term ?? ''))
  const [searching, setSearching] = useState(qParam.length >= 2)
  const [searched, setSearched] = useState(cached?.searched ?? false)
  const [records, setRecords] = useState<ReceptionRecord[] | null>(cached?.records ?? null)
  const [matchTotal, setMatchTotal] = useState(cached?.matchTotal ?? 0)
  const [resultPage, setResultPage] = useState(cached?.resultPage ?? 1)
  const [resultPageSize, setResultPageSize] = useState(cached?.resultPageSize ?? SEARCH_PAGE_SIZE)
  const [searchScope, setSearchScope] = useState<ReceptionSearchScope>(cached?.scope ?? 'primary')
  const [pageLoading, setPageLoading] = useState(false)
  const searchedQRef = useRef('')
  const [activeQuery, setActiveQuery] = useState('')
  const searchSeqRef = useRef(0)
  const extendedRecordsRef = useRef<ReceptionRecord[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [profile, setProfile] = useState<ReceptionProfile | null>(cached?.profile ?? null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)

  useEffect(() => {
    if (!tools) return
    return tools.registerFocus(() => {
      setPickerOpen(false)
      setMoreOpen(false)
      const el = searchRef.current
      if (!el) return
      el.focus()
      el.select()
    })
  }, [tools])

  useEffect(() => {
    if (variant !== 'page') return
    receptionPageCache = {
      term,
      searched,
      records,
      matchTotal,
      resultPage,
      resultPageSize,
      profile,
      scope: searchScope,
    }
  }, [variant, term, searched, records, matchTotal, resultPage, resultPageSize, profile, searchScope])

  useEffect(() => {
    if (variant !== 'modal') return
    let cancelled = false
    void (async () => {
      const raw = await readClipboardText()
      if (cancelled || raw == null) return
      const value = parseClipboardReceptionQuery(raw)
      if (!value) return
      let applied = false
      setTerm((prev) => {
        if (prev.trim()) return prev
        applied = true
        return value
      })
      if (!applied) return
      requestAnimationFrame(() => {
        const el = searchRef.current
        if (!el) return
        el.focus()
        el.select()
      })
    })()
    return () => {
      cancelled = true
    }
  }, [variant])

  useEffect(() => {
    onExpandedChange?.(Boolean(profile))
  }, [onExpandedChange, profile])

  async function loadProfile(id: string) {
    setLoadingProfile(true)
    try {
      const { data } = await api.get<ReceptionProfile>(`/reception/people/${id}`)
      setProfile(data)
      setMoreOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setLoadingProfile(false)
    }
  }

  function leaveTo(path: string) {
    onNavigateAway?.()
    navigate(path)
  }

  function openRecord(record: ReceptionRecord) {
    if (record.type === 'person') {
      void loadProfile(record.id)
      return
    }
    leaveTo(pathForRecord(record))
  }

  const runSearch = useCallback(
    async (
      raw: string,
      options?: {
        preferPicker?: boolean
        page?: number
        keepPicker?: boolean
        scope?: ReceptionSearchScope
      },
    ) => {
      const q = raw.trim()
      if (q.length < 2) {
        toast.error(t('reception.queryTooShort'))
        return
      }
      const page = options?.page ?? 1
      const keepPicker = Boolean(options?.keepPicker)
      const seq = keepPicker ? searchSeqRef.current : ++searchSeqRef.current
      if (!keepPicker) {
        extendedRecordsRef.current = []
        setSearching(true)
        setPickerOpen(false)
        setProfile(null)
      } else {
        setPageLoading(true)
      }
      try {
        const primary = await api.get<ReceptionSearchResult>('/reception/search', {
          params: {
            q,
            scope: 'primary',
            page,
            pageSize: SEARCH_PAGE_SIZE,
          },
        })
        if (seq !== searchSeqRef.current) return
        const data = primary.data
        let hits = recordsFromResult(data)
        if (keepPicker) {
          hits = mergeSearchRecords(hits, extendedRecordsRef.current)
        }
        searchedQRef.current = q
        setActiveQuery(q)
        setSearched(true)
        setSearchScope('primary')
        setMatchTotal(data.total)
        setResultPage(data.page ?? page)
        setResultPageSize(data.pageSize ?? SEARCH_PAGE_SIZE)
        setRecords(hits)

        if (keepPicker) {
          setPickerOpen(true)
          return
        }

        if (hits.length > 0) {
          setSearching(false)
          setPickerOpen(true)
        }

        if (page !== 1) {
          setSearching(false)
          return
        }

        const extended = await api.get<ReceptionSearchResult>('/reception/search', {
          params: { q, scope: 'extended', page: 1, pageSize: SEARCH_PAGE_SIZE },
        })
        if (seq !== searchSeqRef.current) return
        const extra = recordsFromResult(extended.data)
        extendedRecordsRef.current = extra
        setRecords((current) => {
          const base = (current ?? []).filter(
            (item) => item.type === 'person' || item.type === 'reservation',
          )
          return mergeSearchRecords(base.length ? base : recordsFromResult(data), extra)
        })

        const merged = mergeSearchRecords(recordsFromResult(data), extra)
        if (merged.length === 0) {
          setProfile(null)
          setPickerOpen(false)
          return
        }

        const otherTypes = extra.filter((item) => item.type !== 'person')
        const people = mergeSearchRecords(recordsFromResult(data), extra).filter(
          (item) => item.type === 'person',
        )
        if (
          !options?.preferPicker &&
          people.length === 1 &&
          otherTypes.length === 0 &&
          extra.every((item) => item.type === 'person') &&
          data.profile &&
          data.total === 1
        ) {
          setPickerOpen(false)
          setProfile(data.profile)
          return
        }
        if (
          !options?.preferPicker &&
          recordsFromResult(data).length === 0 &&
          extra.length === 1 &&
          extra[0].type !== 'person'
        ) {
          setPickerOpen(false)
          onNavigateAway?.()
          navigate(pathForRecord(extra[0]))
          return
        }
        setProfile(null)
        setPickerOpen(true)
      } catch (error) {
        if (seq !== searchSeqRef.current) return
        toast.error(getApiErrorMessage(error, t('common.error')))
      } finally {
        if (seq === searchSeqRef.current) {
          setSearching(false)
          setPageLoading(false)
        }
      }
    },
    [t, navigate, onNavigateAway],
  )

  useEffect(() => {
    if (variant !== 'page' || qParam.length < 2) return
    if (autoQRef.current === qParam) return
    autoQRef.current = qParam
    setTerm(qParam)
    void runSearch(qParam, { preferPicker: true })
  }, [qParam, runSearch, variant])

  async function onSearch(event: FormEvent) {
    event.preventDefault()
    await runSearch(term)
  }

  const person = profile?.person
  const empty = '—'
  const idle = !person

  const isModal = variant === 'modal'

  return (
    <div className={isModal ? 'w-full' : 'mx-auto w-full max-w-5xl'}>
      <div className={idle ? `flex flex-col justify-center ${isModal ? '' : 'min-h-[52vh]'}` : undefined}>
        <div
          className={
            isModal
              ? 'sticky top-0 z-10 bg-white pb-2'
              : 'sticky top-0 z-10 -mx-4 bg-cream-50/95 px-4 pb-3 pt-1 backdrop-blur-sm sm:-mx-8 sm:px-8'
          }
        >
          <section
            className={
              isModal ? '' : `${cardClassName} mx-auto max-w-2xl p-5 sm:p-7`
            }
          >
            <AppForm
              data-enter-immediate=""
              onSubmit={onSearch}
              autoFocusFirst
              className={isModal ? '' : 'space-y-3'}
            >
              {isModal ? (
                <label htmlFor={searchInputId} className="sr-only">
                  {t('reception.searchLabel')}
                </label>
              ) : (
                <label htmlFor={searchInputId} className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  <Search className="size-4 text-teal-600" aria-hidden />
                  {t('reception.searchLabel')}
                </label>
              )}
              <div
                className={
                  isModal
                    ? 'flex items-stretch gap-2'
                    : 'flex flex-col gap-2 sm:flex-row sm:items-stretch'
                }
              >
                <div className="relative min-w-0 flex-1">
                  <Search
                    className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-teal-600 ${
                      isModal ? 'start-3 size-4' : 'start-3.5 size-5'
                    }`}
                    aria-hidden
                  />
                  <input
                    ref={searchRef}
                    id={searchInputId}
                    className={
                      isModal
                        ? 'w-full rounded-xl border border-line bg-cream-50 py-2.5 ps-9 pe-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200'
                        : 'w-full rounded-2xl border border-line bg-cream-50 py-3.5 ps-11 pe-4 text-base text-ink-900 placeholder:text-ink-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-200'
                    }
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    onFocus={(event) => {
                      const input = event.currentTarget
                      queueMicrotask(() => {
                        if (document.activeElement === input) input.select()
                      })
                    }}
                    onClick={(event) => event.currentTarget.select()}
                    placeholder={t('reception.searchPlaceholder')}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={searching || loadingProfile}
                  className={isModal ? 'shrink-0' : 'sm:min-w-28'}
                >
                  <Search className="size-4" aria-hidden />
                  {t('common.search')}
                </Button>
              </div>
              {isModal ? null : (
                <p className="text-center text-xs leading-6 text-ink-400">{t('reception.searchHint')}</p>
              )}
            </AppForm>
          </section>
        </div>
        {idle && searched && !searching && !loadingProfile && !records?.length ? (
          <div className={`mx-auto w-full max-w-2xl ${isModal ? 'mt-2' : 'mt-4'}`}>
            <FormEmptyHint>
              {t(searchScope === 'extended' ? 'reception.noResultsExtended' : 'reception.noResults')}
            </FormEmptyHint>
          </div>
        ) : null}
        {idle && !searched && !searching && !isModal ? (
          <div className="mx-auto mt-4 w-full max-w-2xl">
            <FormEmptyHint>{t('reception.searchEmpty')}</FormEmptyHint>
          </div>
        ) : null}
      </div>

      {pickerOpen && records?.length ? (
        <ReceptionMatchModal
          records={records}
          total={matchTotal}
          page={resultPage}
          pageSize={resultPageSize}
          scope={searchScope}
          searchKey={activeQuery}
          loading={pageLoading}
          onClose={() => setPickerOpen(false)}
          onSelect={(record) => {
            setPickerOpen(false)
            openRecord(record)
          }}
          onPageChange={(nextPage) => {
            void runSearch(searchedQRef.current || term, {
              page: nextPage,
              keepPicker: true,
              preferPicker: true,
            })
          }}
        />
      ) : null}

      {moreOpen && profile ? (
        <MoreDetailsModal
          person={profile.person}
          onClose={() => setMoreOpen(false)}
        />
      ) : null}

      {searching || loadingProfile ? (
        <LoadingState variant="inline" />
      ) : profile ? (
        <div key={profile.person.id} className="mt-2 animate-page-fade-in space-y-4">
          <FormCard
            icon={UserRound}
            title={profile.person.fullName}
            action={
              <div className="flex max-w-[min(100%,24rem)] items-stretch gap-1.5">
                <OpenUserPanelButton
                  userId={profile.person.id}
                  status={profile.person.status}
                  label={t('reception.viewPilgrimSystem')}
                  className="min-w-0 flex-1 whitespace-normal !px-2 !py-1.5 !text-xs leading-4"
                />
                <Button
                  type="button"
                  onClick={() =>
                    leaveTo(
                      `/reservations/new?forUser=${encodeURIComponent(profile.person.id)}`,
                    )
                  }
                  className="min-w-0 flex-1 whitespace-normal text-center !px-2 !py-1.5 !text-xs leading-4"
                >
                  <Plus className="size-3.5 shrink-0" aria-hidden />
                  {t('reception.createVisitYear', {
                    year: formatNumber(profile.currentYear, locale),
                  })}
                </Button>
              </div>
            }
            chips={
              <>
                <ReceptionKindChips
                  kinds={profile.person.kinds}
                  roles={profile.person.roles}
                  hasHonoraryService={profile.person.hasHonoraryService}
                />
                {profile.person.status === 'INACTIVE' ? (
                  <span className="inline-flex rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-medium text-ink-600 ring-1 ring-line">
                    {t('userStatuses.INACTIVE')}
                  </span>
                ) : null}
              </>
            }
          >
            <div className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <PersonPhoto photoId={profile.person.photoId} name={profile.person.fullName} />
                <div className="grid min-w-0 flex-1 grid-cols-4 gap-1.5">
                  <FormFactTile
                    compact
                    icon={IdCard}
                    label={t('users.nationalId')}
                    copyValue={profile.person.nationalId}
                    tone="teal"
                  />
                  <FormFactTile
                    compact
                    icon={Phone}
                    label={t('users.phone')}
                    copyValue={profile.person.phone}
                    tone="mint"
                  />
                  <FormFactTile
                    compact
                    icon={UserRound}
                    label={t('users.gender')}
                    value={
                      profile.person.gender
                        ? t(`userGenders.${profile.person.gender}`)
                        : empty
                    }
                    empty={!profile.person.gender}
                    tone="ink"
                  />
                  <FormFactTile
                    compact
                    icon={MapPin}
                    label={t('geo.city')}
                    value={nameOf(profile.person.city)}
                    empty={!profile.person.city}
                    tone="teal"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setMoreOpen(true)}>
                  {t('reception.moreDetails')}
                </Button>
                <Link
                  to={personPath(profile.person)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-[0.9rem] py-2.5 text-sm font-medium text-ink-700 transition hover:bg-cream-100"
                >
                  <ExternalLink className="size-4" aria-hidden />
                  {t('reception.openProfile')}
                </Link>
              </div>
            </div>
          </FormCard>

          {profile.honorary ? (
            <FormCard
              icon={HandHeart}
              title={t('reception.honorarySection')}
              subtitle={t('reception.honorarySubtitle')}
            >
              <div className="space-y-3 p-4 sm:p-5">
                <FormSectionTitle icon={History}>
                  {t('reception.honoraryFiles')}
                </FormSectionTitle>
                <VisitList
                  visits={profile.honorary.visits}
                  emptyText={t('reception.noHonoraryFiles')}
                  highlightCode={
                    isReservationCodeQuery(term) ? normalizeReservationCode(term) : ''
                  }
                />
              </div>
            </FormCard>
          ) : null}

          {profile.caravanManager ? (
            <FormCard
              icon={Tent}
              title={t('reception.caravanSection')}
              subtitle={t('reception.caravanSubtitle')}
            >
              <div className="space-y-3 p-4 sm:p-5">
                <FormSectionTitle icon={Tent}>{t('reception.currentCaravans')}</FormSectionTitle>
                {profile.caravanManager.caravans.length === 0 ? (
                  <FormEmptyHint>{t('reception.noCaravans')}</FormEmptyHint>
                ) : (
                  <ul className="overflow-hidden rounded-2xl border border-line bg-white">
                    {profile.caravanManager.caravans.map((caravan) => (
                      <li
                        key={caravan.id}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-3 py-2 last:border-b-0"
                      >
                        <p className="min-w-0 flex-1 text-sm font-semibold text-ink-900">
                          {caravan.name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            caravan.isActive
                              ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-100'
                              : 'bg-cream-100 text-ink-500 ring-1 ring-line'
                          }`}
                        >
                          {caravan.isActive ? t('geo.active') : t('geo.inactive')}
                        </span>
                        <span className="text-xs text-ink-500">
                          {nameOf(caravan.city)}
                          {caravan.licenseNumber
                            ? ` · ${localizeDigits(caravan.licenseNumber, locale)}`
                            : ''}
                        </span>
                        <span className="text-xs font-medium text-ink-700">
                          {t('reception.peopleCount', {
                            count: formatNumber(caravan.totalCount, locale),
                          })}
                        </span>
                        <Link
                          to={`/caravans/${caravan.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
                        >
                          {t('reception.openCaravan')}
                          <ExternalLink className="size-3.5" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <FormSectionTitle icon={History}>{t('reception.caravanHistory')}</FormSectionTitle>
                <VisitList
                  visits={profile.caravanManager.visits}
                  emptyText={t('reception.noCaravanVisits')}
                  showApprovedCounts
                  highlightCode={
                    isReservationCodeQuery(term) ? normalizeReservationCode(term) : ''
                  }
                />
              </div>
            </FormCard>
          ) : null}

          {profile.accommodationManager ? (
            <FormCard
              icon={Building2}
              title={t('reception.housingSection')}
              subtitle={t('reception.housingSubtitle')}
            >
              <div className="space-y-5 p-5 sm:p-6">
                <FormSectionTitle icon={Building2}>
                  {t('reception.currentHousing', {
                    year: formatNumber(profile.currentYear, locale),
                  })}
                </FormSectionTitle>
                {profile.accommodationManager.current.length === 0 ? (
                  <FormEmptyHint>{t('reception.noCurrentHousing')}</FormEmptyHint>
                ) : (
                  <ul className="grid gap-3">
                    {profile.accommodationManager.current.map((row) => (
                      <li key={row.assignmentId}>
                        <HousingCard row={row} current />
                      </li>
                    ))}
                  </ul>
                )}
                <FormSectionTitle icon={History}>{t('reception.housingHistory')}</FormSectionTitle>
                {profile.accommodationManager.history.length === 0 ? (
                  <FormEmptyHint>{t('reception.noHousingHistory')}</FormEmptyHint>
                ) : (
                  <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                    {profile.accommodationManager.history.map((row) => (
                      <li key={row.assignmentId} className="px-4 py-3">
                        <HousingHistoryRow row={row} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </FormCard>
          ) : null}

          <FormCard
            icon={UserRound}
            title={t('reception.pilgrimSection')}
            subtitle={t('reception.pilgrimSubtitle')}
          >
            <div className="space-y-3 p-4 sm:p-5">
              <FormSectionTitle icon={History}>{t('reception.visitHistory')}</FormSectionTitle>
              <VisitList
                visits={profile.pilgrim?.visits ?? []}
                emptyText={t('reception.noVisits')}
                highlightCode={
                  isReservationCodeQuery(term) ? normalizeReservationCode(term) : ''
                }
              />
            </div>
          </FormCard>
        </div>
      ) : null}
    </div>
  )
}

function personPath(person: ReceptionPerson) {
  if (person.kinds.includes('pilgrim')) return `/pilgrims/${person.id}`
  if (person.kinds.includes('caravanManager')) return `/caravan-managers/${person.id}`
  if (person.kinds.includes('accommodationManager')) {
    return `/accommodation-managers/${person.id}`
  }
  return `/users/${person.id}`
}

function PersonPhoto({ photoId, name }: { photoId: string | null; name: string }) {
  if (photoId) {
    return (
      <img
        src={getImageUrl(photoId)}
        alt={name}
        className="size-16 shrink-0 rounded-2xl object-cover ring-1 ring-teal-100"
      />
    )
  }
  return (
    <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_10px_22px_rgba(46,189,182,0.32)]">
      <UserRound className="size-7" aria-hidden />
    </span>
  )
}

function VisitList({
  visits,
  emptyText,
  showApprovedCounts = false,
  highlightCode = '',
}: {
  visits: ReceptionVisit[]
  emptyText: string
  showApprovedCounts?: boolean
  highlightCode?: string
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  if (!visits.length) {
    return <FormEmptyHint>{emptyText}</FormEmptyHint>
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
      {visits.map((visit) => {
        const originName = visit.originCity ? nameOf(visit.originCity) : ''
        const routeName = visit.walkingRoute?.name?.trim() ?? ''
        const hasMeta =
          Boolean(visit.stayStartDate) ||
          Boolean(visit.stayEndDate) ||
          Boolean(visit.walkingStartDate) ||
          Boolean(originName) ||
          Boolean(routeName)
        return (
          <li
            key={visit.id}
            className={`px-4 py-2.5 ${
              highlightCode && visit.code === highlightCode
                ? 'bg-teal-50'
                : ''
            }`}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <ReservationCodeBadge
                code={visit.code}
                size="lg"
                highlighted={Boolean(highlightCode && visit.code === highlightCode)}
              />
              <p className="text-sm font-medium text-ink-500">
                {formatNumber(visit.year, locale)}
              </p>
              <ReservationTypeBadge type={visit.type} />
              <ReservationStatusBadge status={visit.status} />
              <span className="min-w-0 flex-1 text-sm text-ink-600">
                {visit.partyName ?? '—'}
              </span>
              {showApprovedCounts && routeName ? (
                <span className="inline-flex min-w-0 max-w-56 items-center gap-1 text-xs text-ink-600">
                  <Footprints className="size-3.5 shrink-0 text-mint-600" aria-hidden />
                  <span className="truncate">{routeName}</span>
                </span>
              ) : null}
              {showApprovedCounts ? (
                <span className="grid grid-cols-[auto_auto_auto] items-center gap-x-3 gap-y-3 text-xs font-medium text-ink-800">
                  <span className="font-normal text-ink-500">
                    {t('reception.approvedLabel')}
                  </span>
                  <HeadcountCell
                    gender="male"
                    count={visit.maleCount ?? 0}
                    locale={locale}
                  />
                  <HeadcountCell
                    gender="female"
                    count={visit.femaleCount}
                    locale={locale}
                  />
                  <span className="font-normal text-ink-500">
                    {t('reception.requestedLabel')}
                  </span>
                  <HeadcountCell
                    gender="male"
                    count={visit.requestedMaleCount ?? 0}
                    locale={locale}
                  />
                  <HeadcountCell
                    gender="female"
                    count={visit.requestedFemaleCount ?? 0}
                    locale={locale}
                  />
                </span>
              ) : (
                <span className="text-xs text-ink-500">
                  {t('reception.peopleCount', { count: formatNumber(visit.totalCount, locale) })}
                </span>
              )}
              <Link
                to={`/reservations/${visit.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
              >
                {t('reception.openReservation')}
                <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            </div>
            {hasMeta ? (
              <div className="mt-2 space-y-1.5">
                <div className="grid gap-1.5 sm:grid-cols-3">
                  <FormFactTile
                    compact
                    icon={CalendarRange}
                    label={t('reservations.stayStartDate')}
                    value={
                      visit.stayStartDate ? <DateText value={visit.stayStartDate} /> : '—'
                    }
                    empty={!visit.stayStartDate}
                    tone="teal"
                  />
                  <FormFactTile
                    compact
                    icon={CalendarRange}
                    label={t('reservations.stayEndDateShort')}
                    value={
                      visit.stayEndDate ? <DateText value={visit.stayEndDate} /> : '—'
                    }
                    empty={!visit.stayEndDate}
                    tone="mint"
                  />
                  <FormFactTile
                    compact
                    icon={CalendarRange}
                    label={t('reservations.walkingStartDate')}
                    value={
                      visit.walkingStartDate ? (
                        <DateText value={visit.walkingStartDate} />
                      ) : (
                        '—'
                      )
                    }
                    empty={!visit.walkingStartDate}
                    tone="ink"
                  />
                </div>
                {originName || routeName ? (
                  <div className="grid gap-1.5 sm:grid-cols-3">
                    {originName ? (
                      <FormFactTile
                        compact
                        icon={MapPin}
                        label={t('reservations.originCity')}
                        value={originName}
                        tone="teal"
                      />
                    ) : null}
                    {routeName ? (
                      <FormFactTile
                        compact
                        icon={Footprints}
                        label={t('reservations.walkingRoute')}
                        value={routeName}
                        tone="mint"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

function HeadcountCell({
  gender,
  count,
  locale,
}: {
  gender: 'male' | 'female'
  count: number
  locale: string
}) {
  const { t } = useTranslation()
  const male = gender === 'male'
  const Icon = male ? Mars : Venus
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums ${
          male
            ? 'bg-teal-50 text-teal-800 ring-1 ring-teal-100'
            : 'bg-mint-50 text-mint-600 ring-1 ring-mint-100'
        }`}
      >
        {formatNumber(count, locale)}
      </span>
      <Icon
        className={`size-3.5 ${male ? 'text-teal-600' : 'text-mint-600'}`}
        aria-hidden
      />
      <span className="font-normal text-ink-600">
        {t(male ? 'reception.countMale' : 'reception.countFemale')}
      </span>
    </span>
  )
}

function HousingCard({ row, current }: { row: ReceptionHousingRow; current?: boolean }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const nameOf = useGeoName()
  const acc = row.accommodation
  const cap = acc.maleCapacity + acc.femaleCapacity
  const assigned = acc.assignedMaleCapacity + acc.assignedFemaleCapacity
  return (
    <article
      className={`rounded-2xl border p-4 ${
        current
          ? 'border-mint-100 bg-gradient-to-b from-mint-50 to-white'
          : 'border-line bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-ink-900">{acc.name}</p>
          <p className="mt-1 text-xs text-ink-500">
            {t(`accommodationTypes.${acc.type}`)} · {t(`genderTypes.${acc.genderType}`)}
            {acc.city ? ` · ${nameOf(acc.city)}` : ''}
          </p>
        </div>
        {row.isPrimary ? (
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-teal-800 ring-1 ring-teal-100">
            {t('reception.primaryManager')}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <MiniStat
          label={t('reception.capacity')}
          value={`${formatNumber(acc.maleCapacity, locale)} / ${formatNumber(acc.femaleCapacity, locale)}`}
        />
        <MiniStat
          label={t('reception.assigned')}
          value={`${formatNumber(assigned, locale)}${cap ? ` / ${formatNumber(cap, locale)}` : ''}`}
        />
        <MiniStat
          label={t('reception.iceVouchers')}
          value={t('reception.molds', { count: formatNumber(row.iceMoldCount, locale) })}
        />
      </div>
      <Link
        to={`/accommodations/${acc.id}`}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        {t('reception.openAccommodation')}
        <ExternalLink className="size-3.5" aria-hidden />
      </Link>
    </article>
  )
}

function HousingHistoryRow({ row }: { row: ReceptionHousingRow }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const acc = row.accommodation
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="w-16 font-semibold text-ink-900">{formatNumber(row.year, locale)}</p>
      <p className="min-w-0 flex-1 font-medium text-ink-800">{acc.name}</p>
      <span className="text-xs text-ink-500">{t(`accommodationTypes.${acc.type}`)}</span>
      {row.isPrimary ? (
        <span className="text-[11px] text-teal-700">{t('reception.primaryManager')}</span>
      ) : null}
      <span className="text-xs text-ink-500">
        {t('reception.iceVouchers')}{' '}
        {t('reception.molds', { count: formatNumber(row.iceMoldCount, locale) })}
      </span>
      <Link
        to={`/accommodations/${acc.id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
      >
        {t('reception.openAccommodation')}
        <ExternalLink className="size-3.5" aria-hidden />
      </Link>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  )
}

function MoreDetailsModal({
  person,
  onClose,
}: {
  person: ReceptionPerson
  onClose: () => void
}) {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  const empty = '—'

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
      data-nested-dialog
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink-900/30"
        aria-label={t('common.cancel')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reception-more-title"
        className={`relative z-10 flex max-h-[min(90vh,36rem)] w-full max-w-lg flex-col overflow-hidden ${cardClassName}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id="reception-more-title" className="text-base font-semibold text-ink-900">
            {t('reception.moreTitle')}
          </h2>
          <Button type="button" variant="ghost" onClick={onClose} aria-label={t('common.cancel')}>
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="grid gap-2 overflow-y-auto p-5 sm:grid-cols-2 sm:gap-3">
          <FormFactTile icon={UserRound} label={t('users.firstName')} value={person.firstName} />
          <FormFactTile
            icon={UserRound}
            label={t('users.lastName')}
            value={person.lastName}
            tone="mint"
          />
          <FormFactTile
            icon={CalendarRange}
            label={t('users.birthDate')}
            value={person.birthDate ? <DateText value={person.birthDate} /> : empty}
            empty={!person.birthDate}
            tone="ink"
          />
          <FormFactTile
            icon={Mail}
            label={t('users.email')}
            value={person.email ?? empty}
            empty={!person.email}
          />
          <FormFactTile
            icon={MapPin}
            label={t('geo.province')}
            value={nameOf(person.province)}
            empty={!person.province}
            tone="mint"
          />
          <FormFactTile
            icon={MapPin}
            label={t('geo.country')}
            value={nameOf(person.country)}
            empty={!person.country}
            tone="ink"
          />
          <FormFactTile
            icon={MapPin}
            label={t('users.address')}
            value={person.address ?? empty}
            empty={!person.address}
            className="sm:col-span-2"
          />
          <FormFactTile
            icon={Users}
            label={t('users.notes')}
            value={person.notes ?? empty}
            empty={!person.notes}
            tone="ink"
            className="sm:col-span-2"
          />
        </div>
        <div className="border-t border-line px-5 py-4">
          <Link
            to={personPath(person)}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
          >
            <ExternalLink className="size-4" aria-hidden />
            {t('reception.openPerson')}
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  )
}
