import { AlignLeft, CalendarDays, Languages, Megaphone, ToggleRight, Type, Users } from 'lucide-react'
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
import { FormCard, FormEmptyHint, FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { languageDir } from '../../i18n'
import { api } from '../../lib/api'
import type { HeadquartersAnnouncement } from '../../types/app'
import { PublishStatus } from '../headquarters-news/PublishStatus'

export function HeadquartersAnnouncementDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['headquarters-announcements', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HeadquartersAnnouncement>(
        `/headquarters-announcements/${id}`,
      )
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const translations = item.translations ?? []

  return (
    <div className={formShellClassName}>
      <PageHeader
        icon={Megaphone}
        title={t('headquartersAnnouncements.details')}
        subtitle={<EntityNameSubtitle name={item.title} icon={Megaphone} />}
      />
      <FormCard icon={Megaphone} title={item.title}>
        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={Megaphone}>
              {t('headquartersAnnouncements.persianContent')}
            </FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Type}
                label={t('headquartersAnnouncements.titleLabel')}
                value={item.title}
                tone="teal"
                className="sm:col-span-2"
              />
              <FormFactTile
                icon={Users}
                label={t('headquartersAnnouncements.audience')}
                value={t(`headquartersAnnouncements.audiences.${item.audience}`)}
                tone="mint"
              />
              <FormFactTile
                icon={CalendarDays}
                label={t('headquartersAnnouncements.publishedAt')}
                value={<DateText value={item.publishedAt} />}
                tone="teal"
              />
              <FormFactTile
                icon={ToggleRight}
                label={t('headquartersAnnouncements.isPublished')}
                value={<PublishStatus published={item.isPublished} ns="headquartersAnnouncements" />}
                tone="mint"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('headquartersAnnouncements.body')}
                value={<span className="whitespace-pre-wrap">{item.body}</span>}
                tone="ink"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section>
            <FormSectionTitle icon={Languages}>{t('headquartersAnnouncements.translations')}</FormSectionTitle>
            {translations.length ? (
              <div className="space-y-4">
                {translations.map((row) => (
                  <div key={row.locale} className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                    <FormFactTile
                      icon={Languages}
                      label={t('headquartersAnnouncements.availableLocales')}
                      value={t(`languages.${row.locale}`, { defaultValue: row.locale })}
                      tone="teal"
                      className="sm:col-span-2"
                    />
                    <FormFactTile
                      icon={Type}
                      label={t('headquartersAnnouncements.titleLabel')}
                      value={
                        <span dir={languageDir(row.locale)} lang={row.locale}>
                          {row.title}
                        </span>
                      }
                      tone="mint"
                      className="sm:col-span-2"
                    />
                    <FormFactTile
                      icon={AlignLeft}
                      label={t('headquartersAnnouncements.body')}
                      value={
                        <span
                          className="whitespace-pre-wrap"
                          dir={languageDir(row.locale)}
                          lang={row.locale}
                        >
                          {row.body}
                        </span>
                      }
                      tone="ink"
                      className="sm:col-span-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <FormEmptyHint>{t('headquartersAnnouncements.noTranslations')}</FormEmptyHint>
            )}
          </section>
          <DetailActions
            editTo={`/headquarters/announcements/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('headquartersAnnouncements.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('headquartersAnnouncements.confirmDelete'),
                successMessage: t('headquartersAnnouncements.deleted'),
                path: `/headquarters-announcements/${item.id}`,
                queryKey: ['headquarters-announcements'],
                onDeleted: () => navigate('/headquarters/announcements'),
              })
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
