import {
  AlignLeft,
  Banknote,
  Coins,
  Hash,
  HandCoins,
  HandHeart,
  Megaphone,
  Package,
  Scale,
} from 'lucide-react'
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
import { DateText } from '../../components/ui/DateText'
import { FormCard, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatGroupedNumber, formatGroupedQuantity } from '../../lib/datetime'
import type { Contribution } from '../../types/app'

export function ContributionDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['contribution', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<Contribution>(`/contributions/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const amount = `${formatGroupedNumber(item.amount, locale)} ${t('participations.toman')}`

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('contributions.details')}
        subtitle={<EntityNameSubtitle name={item.benefactor.name} icon={HandCoins} />}
      />
      <FormCard icon={HandCoins} title={item.benefactor.name} subtitle={t('contributions.types.' + item.type)}>
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={HandHeart}>{t('contributions.sectionInfo')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={HandHeart}
              label={t('contributions.benefactor')}
              value={item.benefactor.name}
              tone="teal"
            />
            <FormFactTile
              icon={HandCoins}
              label={t('contributions.type')}
              value={t(`contributions.types.${item.type}`)}
              tone="mint"
            />
            <FormFactTile
              icon={Banknote}
              label={t(item.type === 'IN_KIND' ? 'contributions.estimatedValue' : 'contributions.amount')}
              value={amount}
              tone="teal"
            />
            {item.type === 'IN_KIND' ? (
              <>
                <FormFactTile
                  icon={Package}
                  label={t('contributions.goods')}
                  value={item.goods?.name || '—'}
                  tone="mint"
                />
                <FormFactTile
                  icon={Scale}
                  label={t('contributions.unit')}
                  value={item.unit?.name || '—'}
                  tone="ink"
                />
                <FormFactTile
                  icon={Hash}
                  label={t('contributions.quantity')}
                  value={
                    item.quantity != null ? formatGroupedQuantity(item.quantity, locale) : '—'
                  }
                  tone="teal"
                />
              </>
            ) : null}
            <FormFactTile
              icon={Megaphone}
              label={t('contributions.campaign')}
              value={item.campaign?.name || '—'}
              tone="mint"
            />
            {item.shareCount != null ? (
              <FormFactTile
                icon={Coins}
                label={t('contributions.shareCount')}
                value={formatGroupedNumber(item.shareCount, locale)}
                tone="teal"
              />
            ) : null}
            <FormFactTile
              icon={Hash}
              label={t('contributions.trackingCode')}
              copyValue={item.trackingCode}
              value={item.trackingCode || '—'}
              tone="ink"
            />
            <FormFactTile
              icon={AlignLeft}
              label={t('contributions.description')}
              value={item.description || '—'}
              tone="teal"
            />
            <FormFactTile
              icon={HandCoins}
              label={t('common.date')}
              value={<DateText value={item.createdAt} />}
              tone="ink"
            />
          </div>
          <DetailActions
            editTo={`/participations/contributions/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('contributions.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('contributions.confirmDelete'),
                successMessage: t('contributions.deleted'),
                path: `/contributions/${item.id}`,
                queryKey: ['contributions'],
                onDeleted: () => navigate('/participations/contributions'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
