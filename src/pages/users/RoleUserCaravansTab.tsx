import { Tent } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FormSectionTitle } from '../../components/ui/FormLayout'
import {
  ActionsTh,
  EntityRowActions,
  TableCard,
  actionsColClassName,
} from '../../components/ui/ListControls'
import { formatNumber } from '../../lib/datetime'
import { useGeoName } from '../../lib/geo'
import type { ManagedUser } from '../../types/app'
import { CaravanStatusBadge } from '../caravans/CaravanStatusBadge'

export function RoleUserCaravansTab({ user }: { user: ManagedUser }) {
  const { t, i18n } = useTranslation()
  const uiLocale = i18n.language.split('-')[0] ?? 'fa'
  const geoName = useGeoName()

  return (
    <section>
      <FormSectionTitle icon={Tent}>{t('users.tabs.caravans')}</FormSectionTitle>
      <TableCard
        empty={t('caravanManagers.noCaravans')}
        hasRows={Boolean(user.caravans?.length)}
      >
        <table className="w-full text-sm">
          <thead className="bg-cream-50 text-ink-700">
            <tr>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.name')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.city')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.status')}</th>
              <th className="px-4 py-3 text-start font-medium">{t('caravans.foundedYear')}</th>
              <ActionsTh />
            </tr>
          </thead>
          <tbody>
            {(user.caravans ?? []).map((caravan) => (
              <tr key={caravan.id} className="border-t border-line">
                <td className="px-4 py-3">{caravan.name}</td>
                <td className="px-4 py-3">{caravan.city ? geoName(caravan.city) : '—'}</td>
                <td className="px-4 py-3">
                  <CaravanStatusBadge status={caravan.status} isActive={caravan.isActive} />
                </td>
                <td className="px-4 py-3">
                  {caravan.foundedYear != null
                    ? formatNumber(caravan.foundedYear, uiLocale)
                    : '—'}
                </td>
                <td className={actionsColClassName}>
                  <EntityRowActions viewTo={`/caravans/${caravan.id}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>
    </section>
  )
}
