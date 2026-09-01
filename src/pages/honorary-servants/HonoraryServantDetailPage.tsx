import {
  AlignLeft,
  CalendarDays,
  Clock,
  HandHeart,
  IdCard,
  Phone,
  Sparkles,
  Tags,
  UserRound,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthProvider'
import {
  DetailActions,
  EntityNameSubtitle,
  LoadingState,
  PageHeader,
  formShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { DateText } from '../../components/ui/DateText'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api } from '../../lib/api'
import { isAdmin } from '../../lib/roles'
import type { HonoraryServant } from '../../types/app'
import {
  formatHonoraryHours,
  formatHonoraryWeekDays,
  honoraryServiceLabel,
} from './HonoraryServantForm'

export function HonoraryServantDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const admin = isAdmin(user)
  const selfView =
    location.pathname.startsWith('/honorary-history') ||
    location.pathname.startsWith('/honorary-apply')
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['honorary-servant', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<HonoraryServant>(`/honorary-servants/${id}`)
      return data
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const serviceName = honoraryServiceLabel(item, t)
  const description = item.serviceType?.description ?? item.otherDescription ?? ''

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('honoraryServants.details')}
        subtitle={<EntityNameSubtitle name={item.user.fullName} icon={HandHeart} />}
        backTo={selfView ? '/honorary-history' : undefined}
      />
      <FormCard icon={HandHeart} title={item.user.fullName} subtitle={serviceName}>
        <div className="space-y-6 p-5 sm:p-6">
          <FormSectionTitle icon={UserRound}>{t('honoraryServants.person')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={UserRound}
              label={t('honoraryServants.person')}
              value={item.user.fullName}
              tone="teal"
            />
            <FormFactTile
              icon={IdCard}
              label={t('users.nationalId')}
              value={item.user.nationalId || '—'}
              copyValue={item.user.nationalId}
              tone="mint"
            />
            <FormFactTile
              icon={Phone}
              label={t('users.phone')}
              value={item.user.phone || '—'}
              copyValue={item.user.phone}
              tone="ink"
            />
          </div>

          <FormSectionTitle icon={Tags}>{t('honoraryServants.service')}</FormSectionTitle>
          <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-e from-mint-50 via-white to-teal-50 px-5 py-4">
            <div
              className="pointer-events-none absolute -start-8 -top-10 size-28 rounded-full bg-teal-200/30"
              aria-hidden
            />
            <div className="relative flex gap-3">
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-[0_8px_16px_rgba(46,189,182,0.28)]">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink-900">{serviceName}</p>
                {description ? (
                  <p className="mt-1.5 text-sm leading-7 text-ink-700">{description}</p>
                ) : null}
              </div>
            </div>
          </div>
          {item.otherDescription && item.serviceType ? (
            <FormFactTile
              icon={AlignLeft}
              label={t('honoraryServants.otherDescription')}
              value={item.otherDescription}
              tone="ink"
            />
          ) : null}

          <FormSectionTitle icon={CalendarDays}>{t('honoraryServants.schedule')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
            <FormFactTile
              icon={CalendarDays}
              label={t('honoraryServants.startDate')}
              value={<DateText value={item.startDate} />}
              tone="teal"
            />
            <FormFactTile
              icon={CalendarDays}
              label={t('honoraryServants.endDate')}
              value={<DateText value={item.endDate} />}
              tone="mint"
            />
            <FormFactTile
              icon={CalendarDays}
              label={t('honoraryServants.weekDays')}
              value={formatHonoraryWeekDays(item.weekDays, t)}
              tone="ink"
            />
            <FormFactTile
              icon={Clock}
              label={t('honoraryServants.hours')}
              value={
                <span dir="ltr">
                  {formatHonoraryHours(item.startTime, item.endTime, locale)}
                </span>
              }
              tone="teal"
            />
          </div>

          {admin ? (
          <DetailActions
            editTo={`/honorary-servants/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('honoraryServants.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('honoraryServants.confirmDelete'),
                successMessage: t('honoraryServants.deleted'),
                path: `/honorary-servants/${item.id}`,
                queryKey: ['honorary-servants'],
                onDeleted: () => navigate('/honorary-servants'),
              })
            }
          />
          ) : null}
        </div>
      </FormCard>
    </div>
  )
}
