import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { LoadingState, DetailActions, PageHeader, EntityNameSubtitle, cardClassName, userFormShellClassName } from '../../components/ui/Form'
import { TableCard } from '../../components/ui/ListControls'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Accommodation } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'
import { AccommodationYearAlert, managerDisplayName } from './AccommodationYearAlert'
import { AccommodationTabNav, accommodationTabs, type AccommodationTab } from './AccommodationTabs'

export function AccommodationDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
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

  const num = (value: number | null | undefined) =>
    value == null ? '—' : formatNumber(value, locale)

  function panelClass(id: AccommodationTab) {
    return `p-6 ${cardClassName} ${tab === id ? '' : 'hidden'}`
  }

  return (
    <div className={userFormShellClassName}>
      <PageHeader
        title={t('accommodations.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Building2} />}
      />
      <div className="space-y-4">
        <AccommodationYearAlert accommodation={item} />
        <AccommodationTabNav tab={tab} tabs={[...accommodationTabs]} onChange={setTab} />

        <article className={panelClass('general')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('accommodations.name')} value={item.name} />
            <DetailRow label={t('accommodations.type')} value={t(`accommodationTypes.${item.type}`)} />
            <DetailRow label={t('accommodations.status')} value={t(`accommodationStatuses.${item.status}`)} />
            <DetailRow label={t('accommodations.genderType')} value={t(`genderTypes.${item.genderType}`)} />
            <DetailRow
              label={t('accommodations.managementType')}
              value={t(`managementTypes.${item.managementType}`)}
            />
            <DetailRow label={t('accommodations.phone')} value={item.phone ? localizeDigits(item.phone, locale) : '—'} />
            <DetailRow label={t('accommodations.description')} value={item.description || '—'} />
          </dl>
        </article>

        <article className={panelClass('location')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('geo.country')} value={item.country ? name(item.country) : '—'} />
            <DetailRow label={t('geo.province')} value={item.province ? name(item.province) : '—'} />
            <DetailRow label={t('geo.city')} value={item.city ? name(item.city) : '—'} />
            <DetailRow label={t('accommodations.address')} value={item.address || '—'} />
            <DetailRow label={t('accommodations.neshanAddress')} value={item.neshanAddress || '—'} />
            <DetailRow label={t('accommodations.latitude')} value={num(item.latitude)} />
            <DetailRow label={t('accommodations.longitude')} value={num(item.longitude)} />
          </dl>
        </article>

        <article className={panelClass('capacity')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('accommodations.maleCapacity')} value={num(item.maleCapacity)} />
            <DetailRow label={t('accommodations.femaleCapacity')} value={num(item.femaleCapacity)} />
            <DetailRow label={t('accommodations.assignedMaleCapacity')} value={num(item.assignedMaleCapacity)} />
            <DetailRow label={t('accommodations.assignedFemaleCapacity')} value={num(item.assignedFemaleCapacity)} />
            <DetailRow
              label={t('accommodations.distanceToShrineKm')}
              value={item.distanceToShrineKm == null ? '—' : `${num(item.distanceToShrineKm)} ${t('accommodations.km')}`}
            />
            <DetailRow
              label={t('accommodations.distanceToMashhadKm')}
              value={
                item.distanceToMashhadKm == null ? '—' : `${num(item.distanceToMashhadKm)} ${t('accommodations.km')}`
              }
            />
          </dl>
        </article>

        <article className={panelClass('amenities')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow
              label={t('accommodations.hasLaundry')}
              value={item.hasLaundry ? t('accommodations.equipped') : t('accommodations.notEquipped')}
            />
            <DetailRow
              label={t('accommodations.hasInternet')}
              value={item.hasInternet ? t('accommodations.equipped') : t('accommodations.notEquipped')}
            />
            <DetailRow
              label={t('accommodations.hasPrayerRoom')}
              value={item.hasPrayerRoom ? t('accommodations.equipped') : t('accommodations.notEquipped')}
            />
            <DetailRow
              label={t('accommodations.hasElevator')}
              value={item.hasElevator ? t('accommodations.equipped') : t('accommodations.notEquipped')}
            />
            <DetailRow label={t('accommodations.heatingSystem')} value={item.heatingSystem || '—'} />
            <DetailRow label={t('accommodations.coolingSystem')} value={item.coolingSystem || '—'} />
            <DetailRow label={t('accommodations.parkingCapacity')} value={num(item.parkingCapacity)} />
            <DetailRow label={t('accommodations.bathroomCount')} value={num(item.bathroomCount)} />
            <DetailRow label={t('accommodations.toiletCount')} value={num(item.toiletCount)} />
          </dl>
        </article>

        <article className={panelClass('social')}>
          <dl className="grid gap-1 text-sm">
            <DetailRow label={t('accommodations.eitaa')} value={item.eitaa || '—'} />
            <DetailRow label={t('accommodations.bale')} value={item.bale || '—'} />
            <DetailRow label={t('accommodations.otherSocial')} value={item.otherSocial || '—'} />
          </dl>
        </article>

        <article className={panelClass('contacts')}>
          <TableCard
            empty={t('accommodations.noContacts')}
            hasRows={(item.contacts?.length ?? 0) > 0}
          >
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactRole')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactPerson')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('users.phone')}</th>
                </tr>
              </thead>
              <tbody>
                {(item.contacts ?? []).map((contact) => (
                  <tr key={contact.id} className="border-t border-line">
                    <td className="px-4 py-3">{t(`accommodations.contactRoles.${contact.role}`)}</td>
                    <td className="px-4 py-3">{contact.user.fullName}</td>
                    <td className="px-4 py-3">{contact.user.phone ? localizeDigits(contact.user.phone, locale) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableCard>
          {(item.yearContacts?.length ?? 0) > 0 ? (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-ink-700">
                {t('accommodations.sectionYearContacts')}
              </h3>
              <TableCard empty={t('accommodations.noYearContacts')} hasRows>
                <table className="w-full text-sm">
                  <thead className="bg-cream-50 text-ink-700">
                    <tr>
                      <th className="px-4 py-3 text-start font-medium">{t('accommodations.year')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactRole')}</th>
                      <th className="px-4 py-3 text-start font-medium">{t('accommodations.contactPerson')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(item.yearContacts ?? [])]
                      .sort((a, b) =>
                        b.year !== a.year ? b.year - a.year : a.role.localeCompare(b.role),
                      )
                      .map((contact) => (
                        <tr key={contact.id} className="border-t border-line">
                          <td className="px-4 py-3">{formatNumber(contact.year, locale)}</td>
                          <td className="px-4 py-3">
                            {t(`accommodations.contactRoles.${contact.role}`)}
                          </td>
                          <td className="px-4 py-3">{contact.user.fullName}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </TableCard>
            </div>
          ) : null}
        </article>

        <div className={tab === 'managers' ? '' : 'hidden'}>
          <TableCard empty={t('accommodations.noManagers')} hasRows={item.managers.length > 0}>
            <table className="w-full text-sm">
              <thead className="bg-cream-50 text-ink-700">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('accommodations.year')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('accommodations.managerName')}</th>
                </tr>
              </thead>
              <tbody>
                {[...item.managers]
                  .sort((a, b) => (b.year !== a.year ? b.year - a.year : 0))
                  .map((manager) => (
                    <tr key={manager.id} className="border-t border-line">
                      <td className="px-4 py-3">{formatNumber(manager.year, locale)}</td>
                      <td className="px-4 py-3">
                        {managerDisplayName(manager, t('accommodations.unassignedManager'))}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </TableCard>
        </div>

        <div className={`p-6 ${cardClassName}`}>
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
      </div>
    </div>
  )
}
