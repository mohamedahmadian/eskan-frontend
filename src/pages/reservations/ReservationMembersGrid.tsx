import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PaginationBar, SearchBar, TableCard } from '../../components/ui/ListControls'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { formatNumber, toLatinDigits } from '../../lib/datetime'
import type { ReservationMember } from '../../types/app'
import { insurancePaidMethodLabel } from './reservation-steps'
import { InsuranceStatusBadge, MemberInsuranceAmountBadges } from './ReservationStatusBadge'

const PAGE_SIZE = 5

function memberMatches(member: ReservationMember, needle: string) {
  if (!needle) return true
  const hay = [
    member.user.fullName,
    member.user.firstName,
    member.user.lastName,
    member.user.nationalId,
    member.user.phone,
  ]
    .filter(Boolean)
    .map((value) => toLatinDigits(String(value)).toLowerCase())
    .join(' ')
  return hay.includes(needle)
}

export function ReservationMembersGrid({
  members,
  inputId = 'reservation-members-search',
  showInsurance = false,
  showContact = false,
  showServiceRequests = false,
  isCaravan = false,
  beforeTable,
  bareSearch = false,
  renderActions,
}: {
  members: ReservationMember[]
  inputId?: string
  showInsurance?: boolean
  showContact?: boolean
  showServiceRequests?: boolean
  isCaravan?: boolean
  beforeTable?: ReactNode
  bareSearch?: boolean
  renderActions?: (member: ReservationMember) => ReactNode
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const [term, setTerm] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  function applySearch(value: string, force = false) {
    const trimmed = value.trim()
    if (force || trimmed.length === 0 || trimmed.length >= 3) {
      setQuery(trimmed)
      return
    }
    setQuery('')
  }

  const needle = toLatinDigits(query).trim().toLowerCase()
  const visible = useMemo(
    () => (needle ? members.filter((item) => memberMatches(item, needle)) : members),
    [members, needle],
  )
  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const start = (safePage - 1) * PAGE_SIZE
  const pageItems = visible.slice(start, start + PAGE_SIZE)
  const empty = t(
    query
      ? isCaravan
        ? 'reservations.membersSearchEmptyCaravan'
        : 'reservations.membersSearchEmpty'
      : isCaravan
        ? 'reservations.membersEmptyCaravan'
        : 'reservations.membersEmpty',
  )

  useEffect(() => {
    setPage(1)
  }, [query])

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  if (!members.length) {
    return (
      <div>
        {beforeTable}
        <p className="rounded-2xl border border-line bg-gradient-to-b from-cream-50 to-white px-3 py-4 text-sm text-ink-500">
          {t(
            isCaravan
              ? 'reservations.membersEmptyCaravan'
              : 'reservations.membersEmpty',
          )}
        </p>
      </div>
    )
  }

  return (
    <div>
      <SearchBar
        term={term}
        onTermChange={(value) => {
          setTerm(value)
          applySearch(value)
        }}
        onSubmit={() => applySearch(term, true)}
        label={t(
          isCaravan
            ? 'reservations.membersSearchCaravan'
            : 'reservations.membersSearch',
        )}
        placeholder={t('reservations.membersSearchPlaceholder')}
        inputId={inputId}
        autoFocus={false}
        hideSubmit
        bare={bareSearch}
      />
      {beforeTable}
      <TableCard empty={empty} hasRows={pageItems.length > 0} rowClick={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-cream-50 text-ink-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium">{t('reservations.row')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('users.fullName')}</th>
                <th className="px-4 py-3 text-start font-medium">{t('users.nationalId')}</th>
                {showContact ? (
                  <>
                    <th className="px-4 py-3 text-start font-medium">{t('users.gender')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('users.phone')}</th>
                    {showServiceRequests ? (
                      <>
                        <th className="px-4 py-3 text-start font-medium">
                          {t('reservations.memberRequestsSimCard')}
                        </th>
                        <th className="px-4 py-3 text-start font-medium">
                          {t('reservations.memberRequestsBankCard')}
                        </th>
                      </>
                    ) : null}
                  </>
                ) : null}
                {showInsurance ? (
                  <>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('reservations.insuranceStatus')}
                    </th>
                    <th className="px-4 py-3 text-start font-medium">
                      {t('reservations.insurancePaidMethod')}
                    </th>
                  </>
                ) : null}
                {renderActions ? (
                  <th className="px-4 py-3 text-start font-medium">{t('common.actions')}</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((item, index) => {
                const method = showInsurance
                  ? insurancePaidMethodLabel(item.insurancePaidMethod, t)
                  : null
                return (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3 tabular-nums text-ink-600">
                      {formatNumber(start + index + 1, locale)}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">{item.user.fullName}</td>
                    <td className="px-4 py-3">
                      <CopyableDigits value={item.user.nationalId} />
                    </td>
                    {showContact ? (
                      <>
                        <td className="px-4 py-3">
                          {item.user.gender ? t(`userGenders.${item.user.gender}`) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <CopyableDigits value={item.user.phone} />
                        </td>
                        {showServiceRequests ? (
                          <>
                            <td className="px-4 py-3">
                              {item.requestsSimCard ? t('common.yes') : t('common.no')}
                            </td>
                            <td className="px-4 py-3">
                              {item.requestsBankCard ? t('common.yes') : t('common.no')}
                            </td>
                          </>
                        ) : null}
                      </>
                    ) : null}
                    {showInsurance ? (
                      <>
                        <td className="px-4 py-3">
                          <InsuranceStatusBadge status={item.insuranceStatus} />
                          <MemberInsuranceAmountBadges
                            coverageAmount={item.insuranceCoverageAmount}
                            premiumAmount={item.insurancePaidAmount}
                            locale={locale}
                          />
                        </td>
                        <td className="px-4 py-3">
                          {method ? (
                            <span>
                              {method}
                              {item.insurancePaidBy?.fullName
                                ? ` · ${item.insurancePaidBy.fullName}`
                                : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </>
                    ) : null}
                    {renderActions ? <td className="px-4 py-3">{renderActions(item)}</td> : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </TableCard>
      <PaginationBar
        page={safePage}
        pageSize={PAGE_SIZE}
        total={visible.length}
        onPageChange={setPage}
      />
    </div>
  )
}
