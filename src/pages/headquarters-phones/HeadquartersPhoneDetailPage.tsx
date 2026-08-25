import { AlignLeft, Building2, Landmark, Phone } from 'lucide-react'
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
import { useInvalidateHeadquartersBranding } from '../../hooks/useHeadquartersSummary'
import { api } from '../../lib/api'
import { localizeDigits } from '../../lib/datetime'
import type { HeadquartersPhone } from '../../types/app'

export function HeadquartersPhoneDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id, phoneId } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const invalidateBranding = useInvalidateHeadquartersBranding()
  const query = useQuery({
    queryKey: ['headquarters-phone', phoneId],
    enabled: Boolean(phoneId),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersPhone>(`/headquarters-phones/${phoneId}`)
      return data
    },
  })

  const item = query.data
  if (!item || !id) {
    return <LoadingState />
  }

  const phoneLabel = localizeDigits(item.phone, locale)

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersPhones.details')}
        subtitle={<EntityNameSubtitle name={phoneLabel} icon={Phone} />}
      />
      <FormCard icon={Phone} title={phoneLabel} subtitle={item.department || undefined}>
        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={Phone}>{t('headquartersPhones.details')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Landmark}
                label={t('headquartersInfo.name')}
                value={item.headquarters?.name || '—'}
                empty={!item.headquarters?.name}
                tone="teal"
              />
              <FormFactTile
                icon={Phone}
                label={t('headquartersPhones.phone')}
                value={<span dir="ltr">{phoneLabel}</span>}
                tone="mint"
              />
              <FormFactTile
                icon={Building2}
                label={t('headquartersPhones.department')}
                value={item.department || '—'}
                empty={!item.department}
                tone="teal"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('headquartersPhones.description')}
                value={
                  item.description ? (
                    <span className="whitespace-pre-wrap">{item.description}</span>
                  ) : (
                    '—'
                  )
                }
                empty={!item.description}
                tone="mint"
                className="sm:col-span-2"
              />
            </div>
          </section>
          <DetailActions
            editTo={`/headquarters/info/${id}/phones/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('headquartersPhones.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('headquartersPhones.confirmDelete'),
                successMessage: t('headquartersPhones.deleted'),
                path: `/headquarters-phones/${item.id}`,
                queryKey: ['headquarters-phones'],
                onDeleted: () => {
                  void invalidateBranding()
                  navigate(`/headquarters/info/${id}/phones`)
                },
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
