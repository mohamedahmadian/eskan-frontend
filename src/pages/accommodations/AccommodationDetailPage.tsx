import { useQuery } from '@tanstack/react-query'
import { type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { DetailActions, PageHeader, cardClassName, formShellClassName } from '../../components/ui/Form'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { Accommodation } from '../../types/app'
import { DetailRow } from '../geo/GeoShared'

export function AccommodationDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
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
    return <p className="text-ink-500">{t('common.loading')}</p>
  }

  const num = (value: number | null | undefined) =>
    value == null ? '—' : formatNumber(value, locale)

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('accommodations.details')}
        subtitle={t('accommodations.detailsSubtitle')}
        action={
          <Link to="/accommodations" className="text-sm text-teal-700 hover:underline">
            {t('accommodations.backToList')}
          </Link>
        }
      />
      <div className="space-y-4">
        <Section title={t('accommodations.sectionGeneral')}>
          <DetailRow label={t('accommodations.name')} value={item.name} />
          <DetailRow label={t('accommodations.type')} value={t(`accommodationTypes.${item.type}`)} />
          <DetailRow label={t('accommodations.status')} value={t(`accommodationStatuses.${item.status}`)} />
          <DetailRow label={t('accommodations.genderType')} value={t(`genderTypes.${item.genderType}`)} />
          <DetailRow label={t('accommodations.phone')} value={item.phone || '—'} />
          <DetailRow label={t('accommodations.description')} value={item.description || '—'} />
        </Section>
        <Section title={t('accommodations.sectionLocation')}>
          <DetailRow label={t('geo.country')} value={item.country ? name(item.country) : '—'} />
          <DetailRow label={t('geo.province')} value={item.province ? name(item.province) : '—'} />
          <DetailRow label={t('geo.city')} value={item.city ? name(item.city) : '—'} />
          <DetailRow label={t('accommodations.address')} value={item.address || '—'} />
          <DetailRow label={t('accommodations.neshanAddress')} value={item.neshanAddress || '—'} />
          <DetailRow label={t('accommodations.latitude')} value={num(item.latitude)} />
          <DetailRow label={t('accommodations.longitude')} value={num(item.longitude)} />
        </Section>
        <Section title={t('accommodations.sectionCapacity')}>
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
            value={item.distanceToMashhadKm == null ? '—' : `${num(item.distanceToMashhadKm)} ${t('accommodations.km')}`}
          />
        </Section>
        <Section title={t('accommodations.sectionAmenities')}>
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
        </Section>
        <Section title={t('accommodations.sectionSocial')}>
          <DetailRow label={t('accommodations.eitaa')} value={item.eitaa || '—'} />
          <DetailRow label={t('accommodations.bale')} value={item.bale || '—'} />
          <DetailRow label={t('accommodations.otherSocial')} value={item.otherSocial || '—'} />
        </Section>
        <Section title={t('accommodations.sectionManagers')}>
          {item.managers.length ? (
            item.managers.map((manager) => (
              <DetailRow
                key={manager.id}
                label={manager.user.fullName}
                value={
                  manager.isPrimary
                    ? `${manager.user.username} · ${t('accommodations.primaryManager')}`
                    : manager.user.username
                }
              />
            ))
          ) : (
            <p className="text-sm text-ink-500">{t('accommodations.noManagers')}</p>
          )}
        </Section>
        <div className={`p-6 ${cardClassName}`}>
          <DetailActions
            className=""
            editTo={`/accommodations/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('accommodations.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('accommodations.confirmDelete'),
                successMessage: t('accommodations.deleted'),
                path: `/accommodations/${item.id}`,
                queryKey: ['accommodations'],
                onDeleted: () => navigate('/accommodations'),
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className={`p-6 ${cardClassName}`}>
      <h2 className="mb-4 text-base font-semibold text-ink-900">{title}</h2>
      <dl className="grid gap-1 text-sm">{children}</dl>
    </article>
  )
}
