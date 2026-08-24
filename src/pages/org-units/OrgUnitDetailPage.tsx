import { AlignLeft, Building, MessageCircle, Phone, Send, UserRound, Users } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
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
  FormFactTile,
  FormSectionTitle,
} from '../../components/ui/FormLayout'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import type { OrgUnit } from '../../types/app'

export function OrgUnitDetailPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const navigate = useNavigate()
  const { confirmDelete } = useConfirmDelete()
  const query = useQuery({
    queryKey: ['org-unit', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<OrgUnit>(`/org-units/${id}`)
      return data
    },
  })

  const inviteSms = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ queued: true; recipientCount: number }>(
        `/org-units/${id}/invite-liaisons-sms`,
        { kind: 'all' },
      )
      return data
    },
    onSuccess: (data) => {
      toast.success(
        t('orgUnits.inviteSmsQueued', {
          count: formatNumber(data.recipientCount, locale),
        }),
      )
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    },
  })

  const item = query.data
  if (!item) {
    return <LoadingState />
  }

  const canInvite =
    Boolean(item.eitaaChannel || item.telegramChannel) &&
    item.accommodationLiaisonCount + item.caravanLiaisonCount > 0

  function confirmInviteSms() {
    confirmToast({
      title: t('orgUnits.confirmInviteSms'),
      confirmLabel: t('orgUnits.sendInviteSms'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        await inviteSms.mutateAsync()
      },
    })
  }

  return (
    <div className={formShellClassName}>
      <PageHeader
        title={t('orgUnits.details')}
        subtitle={<EntityNameSubtitle name={item.name} icon={Building} />}
      />
      <FormCard
        icon={Building}
        title={item.name}
        subtitle={t('orgUnits.detailsSubtitle')}
      >
        <div className="space-y-6 p-5 sm:p-6">
          <section>
            <FormSectionTitle icon={Building}>{t('orgUnits.details')}</FormSectionTitle>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
              <FormFactTile
                icon={Building}
                label={t('orgUnits.name')}
                value={item.name}
                tone="teal"
              />
              <FormFactTile
                icon={Phone}
                label={t('orgUnits.phone')}
                value={item.phone ? localizeDigits(item.phone, locale) : '—'}
                empty={!item.phone}
                tone="mint"
              />
              <FormFactTile
                icon={MessageCircle}
                label={t('orgUnits.eitaaChannel')}
                value={item.eitaaChannel || '—'}
                empty={!item.eitaaChannel}
                tone="teal"
              />
              <FormFactTile
                icon={Send}
                label={t('orgUnits.telegramChannel')}
                value={item.telegramChannel || '—'}
                empty={!item.telegramChannel}
                tone="mint"
              />
              <FormFactTile
                icon={UserRound}
                label={t('orgUnits.manager')}
                value={item.manager?.fullName || '—'}
                empty={!item.manager}
                tone="teal"
              />
              <FormFactTile
                icon={Users}
                label={t('orgUnits.accommodationLiaisonCount')}
                value={formatNumber(item.accommodationLiaisonCount, locale)}
                tone="mint"
              />
              <FormFactTile
                icon={Users}
                label={t('orgUnits.caravanLiaisonCount')}
                value={formatNumber(item.caravanLiaisonCount, locale)}
                tone="teal"
              />
              <FormFactTile
                icon={AlignLeft}
                label={t('orgUnits.description')}
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
            editTo={`/headquarters/units/${item.id}/edit`}
            editLabel={t('common.edit')}
            deleteLabel={t('orgUnits.delete')}
            onDelete={() =>
              confirmDelete({
                message: t('orgUnits.confirmDelete'),
                successMessage: t('orgUnits.deleted'),
                path: `/org-units/${item.id}`,
                queryKey: ['org-units'],
                onDeleted: () => navigate('/headquarters/units'),
              })
            }
            extra={
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="soft"
                  disabled={!canInvite || inviteSms.isPending}
                  onClick={confirmInviteSms}
                >
                  <Send className="size-4" aria-hidden />
                  {t('orgUnits.sendInviteSms')}
                </Button>
                <Link to={`/headquarters/units/${item.id}/liaisons`}>
                  <Button type="button" variant="soft">
                    <Users className="size-4" aria-hidden />
                    {t('orgUnits.manageLiaisons')}
                  </Button>
                </Link>
              </div>
            }
          />
        </div>
      </FormCard>
    </div>
  )
}
