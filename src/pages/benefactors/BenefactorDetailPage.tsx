import { AlignLeft, Compass, HandHeart, IdCard, MapPin, Navigation, Phone, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber } from '../../lib/datetime'
import { isAnonymousBenefactor } from '../../lib/benefactors'
import { useGeoName } from '../../lib/geo'
import type { Benefactor } from '../../types/app'

export function BenefactorDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const name = useGeoName()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['benefactor', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Benefactor>(`/benefactors/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('benefactors.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={HandHeart} />}
      />
      <FormCard icon={HandHeart} title={item.name}>
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={UserRound}>{t('benefactors.detailsSubtitle')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile icon={UserRound} label={t('benefactors.firstName')} value={item.firstName} tone="teal" />
            <FormFactTile icon={UserRound} label={t('benefactors.lastName')} value={item.lastName} tone="mint" />
            <FormFactTile
              icon={IdCard}
              label={t('benefactors.nationalId')}
              copyValue={item.nationalId}
              value={item.nationalId || '—'}
              tone="ink"
            />
            <FormFactTile
              icon={Phone}
              label={t('benefactors.phone')}
              copyValue={item.phone}
              value={item.phone || '—'}
              tone="teal"
            />
            <FormFactTile
              icon={MapPin}
              label={t('geo.province')}
              value={item.province ? name(item.province) : '—'}
              tone="mint"
            />
            <FormFactTile
              icon={MapPin}
              label={t('geo.city')}
              value={item.city ? name(item.city) : '—'}
              tone="ink"
            />
            <FormFactTile
              icon={MapPin}
              label={t('benefactors.address')}
              value={item.address || '—'}
              tone="teal"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('benefactors.description')}
              value={item.description || '—'}
              tone="mint"
            />
            <FormFactTile
              icon={Navigation}
              label={t('geo.neshanAddress')}
              value={item.neshanAddress || '—'}
              tone="ink"
            />
            <FormFactTile
              icon={Compass}
              label={t('geo.latitude')}
              value={item.latitude != null ? formatNumber(item.latitude, locale) : '—'}
              tone="teal"
            />
            <FormFactTile
              icon={Compass}
              label={t('geo.longitude')}
              value={item.longitude != null ? formatNumber(item.longitude, locale) : '—'}
              tone="mint"
            />
          </div>
          <DetailActions
            editTo={`/base-info/benefactors/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={isAnonymousBenefactor(item) ? undefined : t('benefactors.delete')}
            onDelete={
              isAnonymousBenefactor(item)
                ? undefined
                : () =>
                    confirmDelete({
                      message: t('benefactors.confirmDelete'),
                      successMessage: t('benefactors.deleted'),
                      path: `/benefactors/${item.id}`,
                      queryKey: ['benefactors'],
                      onDeleted: () => navigate('/base-info/benefactors'),
                    })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
