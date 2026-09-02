import {
  AlignLeft,
  Calendar,
  Globe,
  Landmark,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  Phone,
  Share2,
  Type,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { OsmMapPicker } from '../../components/ui/OsmMapPicker'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import type { HeadquartersInfo } from '../../types/app'

export function HeadquartersInfoDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['headquarters-info', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersInfo>(`/headquarters-info/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const phones = item.phones ?? []

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('headquartersInfo.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Landmark} />}
      />
      <FormCard
        icon={Landmark}
        title={item.name}
        subtitle={item.title || t('headquartersInfo.detailsSubtitle')}
      >
        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={Landmark}>{t('headquartersInfo.details')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Landmark}
                label={t('headquartersInfo.name')}
                value={item.name}
                tone="teal"
              />
              <FormFactTile
                icon={Type}
                label={t('headquartersInfo.titleLabel')}
                value={item.title || '—'}
                empty={!item.title}
                tone="mint"
              />
              <FormFactTile
                icon={Calendar}
                label={t('headquartersInfo.activityStartYear')}
                value={
                  item.activityStartYear != null
                    ? formatNumber(item.activityStartYear, locale)
                    : '—'
                }
                empty={item.activityStartYear == null}
                tone="teal"
              />
              <FormFactTile
                icon={MapPin}
                label={t('headquartersInfo.address')}
                value={item.address ? <span className="whitespace-pre-wrap">{item.address}</span> : '—'}
                empty={!item.address}
                tone="teal"
                className="sm:col-span-2"
              />
              <FormFactTile
                icon={Navigation}
                label={t('headquartersInfo.neshanAddress')}
                value={
                  item.neshanAddress ? (
                    <NeshanValue value={item.neshanAddress} />
                  ) : (
                    '—'
                  )
                }
                empty={!item.neshanAddress}
                tone="mint"
                className="sm:col-span-2"
              />
              {item.latitude != null && item.longitude != null ? (
                <div className="sm:col-span-2">
                  <FormFactTile
                    icon={MapPinned}
                    label={t('headquartersInfo.location')}
                    value={
                      <span dir="ltr">
                        {localizeDigits(String(item.latitude), locale)}
                        {', '}
                        {localizeDigits(String(item.longitude), locale)}
                      </span>
                    }
                    tone="teal"
                  />
                  <div className="mt-3">
                    <OsmMapPicker
                      latitude={String(item.latitude)}
                      longitude={String(item.longitude)}
                      onChange={() => undefined}
                      variant="always"
                      readOnly
                      heightClass="h-64"
                    />
                  </div>
                </div>
              ) : (
                <FormFactTile
                  icon={MapPinned}
                  label={t('headquartersInfo.location')}
                  value="—"
                  empty
                  tone="teal"
                />
              )}
              <FormFactTile
                icon={Phone}
                label={t('headquartersInfo.phoneCount')}
                value={formatNumber(item.phoneCount, locale)}
                tone="mint"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('headquartersInfo.description')}
                value={
                  item.description ? (
                    <span className="whitespace-pre-wrap">{item.description}</span>
                  ) : (
                    '—'
                  )
                }
                empty={!item.description}
                tone="teal"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={Share2}>{t('headquartersInfo.socialSection')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Globe}
                label={t('headquartersInfo.website')}
                value={item.website ? <span dir="ltr">{item.website}</span> : '—'}
                empty={!item.website}
                tone="teal"
              />
              <FormFactTile
                icon={Share2}
                label={t('headquartersInfo.eitaa')}
                value={item.eitaa ? <span dir="ltr">{item.eitaa}</span> : '—'}
                empty={!item.eitaa}
                tone="mint"
              />
              <FormFactTile
                icon={MessageCircle}
                label={t('headquartersInfo.bale')}
                value={item.bale ? <span dir="ltr">{item.bale}</span> : '—'}
                empty={!item.bale}
                tone="teal"
              />
              <FormFactTile
                icon={MessageCircle}
                label={t('headquartersInfo.telegram')}
                value={item.telegram ? <span dir="ltr">{item.telegram}</span> : '—'}
                empty={!item.telegram}
                tone="mint"
              />
              <FormFactTile
                icon={Share2}
                label={t('headquartersInfo.instagram')}
                value={item.instagram ? <span dir="ltr">{item.instagram}</span> : '—'}
                empty={!item.instagram}
                tone="teal"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={Phone}>{t('headquartersPhones.title')}</FormSectionTitle>
            {phones.length ? (
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                {phones.map((phone, index) => (
                  <FormFactTile
                    key={phone.id}
                    icon={Phone}
                    label={phone.department || t('headquartersPhones.phone')}
                    value={
                      <span className="inline-flex flex-col gap-0.5">
                        <span dir="ltr" className="whitespace-nowrap">
                          {localizeDigits(phone.phone, locale)}
                        </span>
                        {phone.description ? (
                          <span className="text-xs font-medium text-ink-500">{phone.description}</span>
                        ) : null}
                      </span>
                    }
                    tone={index % 2 === 0 ? 'mint' : 'teal'}
                  />
                ))}
              </div>
            ) : (
              <FormEmptyHint>{t('headquartersPhones.empty')}</FormEmptyHint>
            )}
          </section>

          <DetailActions
            editTo={`/headquarters/info/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('headquartersInfo.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('headquartersInfo.confirmDelete'),
                successMessage: t('headquartersInfo.deleted'),
                path: `/headquarters-info/${item.id}`,
                queryKey: ['headquarters-info'],
                onDeleted: () => navigate('/headquarters/info'),
              })
            }
            extra={
              <Link to={`/headquarters/info/${item.id}/phones`}>
                <Button type="button" variant="soft">
                  <Phone className="size-4" aria-hidden />
                  {t('headquartersPhones.manage')}
                </Button>
              </Link>
            }
          />
        </div>
      </FormCard>
    </div>
  )
}

function NeshanValue({ value }: { value: string }) {
  if (/^https?:\/\//i.test(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        dir="ltr"
        className="break-all text-teal-700 hover:underline"
      >
        {value}
      </a>
    )
  }
  return <span dir="ltr">{value}</span>
}
