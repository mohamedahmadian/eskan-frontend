import {
  AlertCircle,
  Building2,
  CalendarDays,
  CookingPot,
  Hash,
  ImageDown,
  Layers,
  Mars,
  MessageSquare,
  Sunrise,
  Trash2,
  Truck,
  UtensilsCrossed,
  Venus,
} from 'lucide-react'
import { type FormEvent, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toPng } from 'html-to-image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { CopyableDigits } from '../../components/ui/CopyableDigits'
import { DateText } from '../../components/ui/DateText'
import {
  AppForm,
  Button,
  EntityNameSubtitle,
  FormActions,
  FormField,
  LoadingState,
  PageHeader,
  inputClassName,
  userFormShellClassName,
} from '../../components/ui/Form'
import {
  FormCard,
  FormEmptyHint,
  FormFactTile,
  FormMetaChip,
  FormSectionTitle,
  formCardBodyClassName,
} from '../../components/ui/FormLayout'
import { SmsPreviewModal } from '../../components/sms/SmsPreviewModal'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { useConfirmDelete } from '../../hooks/useConfirmDelete'
import { useSendSms } from '../../hooks/useSendSms'
import { languageDir } from '../../i18n'
import { api, getApiErrorMessage } from '../../lib/api'
import { formatNumber, localizeDigits } from '../../lib/datetime'
import { MealPlanDistributionSmsAllModal } from './MealPlanDistributionSmsAllModal'
import {
  buildMealPlanDistributionSmsBody,
  managersWithPhone,
  primaryManager,
} from './mealPlanDistributionSms'
import type {
  ManagementType,
  RestaurantMealPlan,
  RestaurantMealPlanDistribution,
} from '../../types/app'

type DistributionLookup = {
  id: string
  name: string
  managementType: ManagementType
  maleCapacity: number
  femaleCapacity: number
}

type DistributionsPayload = {
  mealPlan: RestaurantMealPlan
  items: RestaurantMealPlanDistribution[]
  totalServings: number
  distributedServings: number
  remainingServings: number
}

export function RestaurantMealPlanDistributePage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { confirmDelete } = useConfirmDelete()
  const sms = useSendSms()
  const [accommodationId, setAccommodationId] = useState('')
  const [servings, setServings] = useState('')
  const [smsPhone, setSmsPhone] = useState('')
  const [smsBody, setSmsBody] = useState('')
  const [smsOpen, setSmsOpen] = useState(false)
  const [smsAllOpen, setSmsAllOpen] = useState(false)
  const [sendingSms, setSendingSms] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const query = useQuery({
    queryKey: ['restaurant-meal-plan-distributions', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<DistributionsPayload>(
        `/restaurant-meal-plans/${id}/distributions`,
      )
      return data
    },
  })

  const accommodations = useQuery({
    queryKey: ['restaurant-meal-plan-distribution-accommodations', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await api.get<DistributionLookup[]>(
        `/restaurant-meal-plans/${id}/distribution-accommodations`,
      )
      return data
    },
  })

  const add = useMutation({
    mutationFn: async () => {
      await api.post(`/restaurant-meal-plans/${id}/distributions`, {
        accommodationId,
        servings: Number(servings),
      })
    },
    onSuccess: async () => {
      setAccommodationId('')
      setServings('')
      toast.success(t('restaurantMealPlans.distributionAdded'))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['restaurant-meal-plan-distributions', id] }),
        queryClient.invalidateQueries({
          queryKey: ['restaurant-meal-plan-distribution-accommodations', id],
        }),
        queryClient.invalidateQueries({ queryKey: ['restaurant-meal-plans'] }),
        queryClient.invalidateQueries({ queryKey: ['restaurant-meal-plan', id] }),
      ])
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const data = query.data
  if (!data) {
    return <LoadingState />
  }

  const item = data.mealPlan
  const remaining = data.remainingServings
  const rows = data.items
  const requested = Number(servings)
  const overRemaining = Boolean(servings) && requested > remaining
  const selectedAccommodation = (accommodations.data ?? []).find(
    (accommodation) => accommodation.id === accommodationId,
  )
  const showMaleCapacity = Boolean(selectedAccommodation && selectedAccommodation.maleCapacity > 0)
  const showFemaleCapacity = Boolean(
    selectedAccommodation && selectedAccommodation.femaleCapacity > 0,
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!accommodationId) {
      toast.error(t('restaurantMealPlans.selectAccommodation'))
      return
    }
    if (!servings || Number(servings) < 1) {
      toast.error(t('restaurantMealPlans.requestedServingsRequired'))
      return
    }
    if (overRemaining) {
      return
    }
    add.mutate()
  }

  function openRowSms(row: RestaurantMealPlanDistribution) {
    const manager = managersWithPhone(row)[0]
    if (!manager?.user?.phone) {
      toast.error(t('restaurantMealPlans.smsNoManager'))
      return
    }
    setSmsPhone(manager.user.phone)
    setSmsBody(buildMealPlanDistributionSmsBody(item, row.servings, locale, t))
    setSmsOpen(true)
  }

  async function sendRowSms() {
    const phone = smsPhone.trim()
    const body = smsBody.trim()
    if (!phone) {
      toast.error(t('sms.noRecipient'))
      return
    }
    if (!body) {
      toast.error(t('restaurantMealPlans.smsBodyRequired'))
      return
    }
    setSendingSms(true)
    try {
      await sms.mutateAsync({ phone, body })
      toast.success(t('sms.queued'))
      setSmsOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSendingSms(false)
    }
  }

  async function sendAllSms() {
    const jobs = rows.flatMap((row) =>
      managersWithPhone(row).map((manager) => ({
        phone: manager.user!.phone!.trim(),
        body: buildMealPlanDistributionSmsBody(item, row.servings, locale, t),
      })),
    )
    if (!jobs.length) {
      toast.error(t('restaurantMealPlans.smsNoRecipients'))
      return
    }
    setSendingSms(true)
    try {
      for (const job of jobs) {
        await sms.mutateAsync(job)
      }
      toast.success(
        jobs.length > 1
          ? t('sms.queuedCount', { count: formatNumber(jobs.length, locale) })
          : t('sms.queued'),
      )
      setSmsAllOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('sms.sendFailed')))
    } finally {
      setSendingSms(false)
    }
  }

  function publishList() {
    if (!rows.length) return
    setPublishing(true)
  }

  useLayoutEffect(() => {
    if (!publishing) return
    const node = listRef.current
    if (!node) {
      setPublishing(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        await document.fonts?.ready
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        if (cancelled || !node.isConnected) return
        const dataUrl = await toPng(node, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          cacheBust: true,
          style: { insetInlineStart: '0', left: '0', top: '0' },
        })
        if (cancelled) return
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `distribution-list-${item.planDate}.png`
        link.click()
        toast.success(t('restaurantMealPlans.listPublished'))
      } catch {
        if (!cancelled) toast.error(t('restaurantMealPlans.publishListFailed'))
      } finally {
        if (!cancelled) setPublishing(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [publishing, item.planDate, t])

  return (
    <div className={`${userFormShellClassName} space-y-6`}>
      <PageHeader
        title={t('restaurantMealPlans.distribute')}
        subtitle={<EntityNameSubtitle name={item.restaurant.name} icon={CookingPot} />}
      />
      <FormCard
        icon={CookingPot}
        title={item.restaurant.name}
        chips={
          <>
            <FormMetaChip icon={UtensilsCrossed} label={item.food.name} />
            <FormMetaChip
              icon={Sunrise}
              label={t(`restaurantMealPlans.mealTypes.${item.mealType}`)}
            />
            <FormMetaChip
              icon={Hash}
              label={`${formatNumber(item.servings, locale)} ${t('restaurantMealPlans.servings')}`}
            />
            <FormMetaChip icon={CalendarDays} label={<DateText value={item.planDate} />} />
          </>
        }
      >
        <div className="space-y-4 p-5 sm:p-6">
          <FormSectionTitle icon={Layers}>{t('restaurantMealPlans.stats')}</FormSectionTitle>
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            <FormFactTile
              icon={Hash}
              label={t('restaurantMealPlans.totalServings')}
              value={formatNumber(data.totalServings, locale)}
              tone="teal"
            />
            <FormFactTile
              icon={Truck}
              label={t('restaurantMealPlans.distributedServings')}
              value={formatNumber(data.distributedServings, locale)}
              tone="mint"
            />
            <FormFactTile
              icon={Hash}
              label={t('restaurantMealPlans.remainingServings')}
              value={formatNumber(data.remainingServings, locale)}
              tone="ink"
            />
          </div>
        </div>
      </FormCard>

      <FormCard
        icon={Building2}
        title={t('restaurantMealPlans.selectAccommodationTitle')}
        subtitle={t('restaurantMealPlans.addAccommodationSubtitle')}
      >
        {remaining <= 0 ? (
          <div className="p-5 sm:p-6">
            <FormEmptyHint>{t('restaurantMealPlans.noRemainingServings')}</FormEmptyHint>
          </div>
        ) : (
          <AppForm onSubmit={submit} className={formCardBodyClassName}>
            <FormField
              icon={Building2}
              label={t('restaurantMealPlans.accommodation')}
              htmlFor="distribution-accommodation"
            >
              <SearchSelect
                id="distribution-accommodation"
                value={accommodationId}
                required
                onChange={setAccommodationId}
                placeholder={t('restaurantMealPlans.selectAccommodation')}
                options={[
                  { value: '', label: t('restaurantMealPlans.selectAccommodation') },
                  ...(accommodations.data ?? []).map((accommodation) => ({
                    value: accommodation.id,
                    label: `${accommodation.name} (${t(`managementTypes.${accommodation.managementType}`)})`,
                  })),
                ]}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
              <div className="space-y-2">
                <FormField
                  icon={Hash}
                  label={t('restaurantMealPlans.requestedServings')}
                  htmlFor="distribution-servings"
                >
                  <input
                    id="distribution-servings"
                    type="number"
                    min={1}
                    step={1}
                    required
                    aria-invalid={overRemaining}
                    className={`${inputClassName(overRemaining)} digit-field`}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </FormField>
                {overRemaining ? (
                  <aside
                    className="relative overflow-hidden rounded-2xl border-2 border-red-200 bg-gradient-to-b from-red-50 via-white to-white px-3 py-3 shadow-[0_10px_22px_rgba(185,28,28,0.12)]"
                    role="alert"
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1 bg-gradient-to-e from-red-400 via-red-500 to-red-400"
                      aria-hidden
                    />
                    <div className="flex items-start gap-3 pt-1">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-500 text-white shadow-[0_8px_16px_rgba(185,28,28,0.28)]">
                        <AlertCircle className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 space-y-0.5 pt-0.5">
                        <p className="text-sm font-bold text-red-800">
                          {t('restaurantMealPlans.quantityOverRemainingTitle')}
                        </p>
                        <p className="text-sm leading-7 text-ink-800">
                          {t('restaurantMealPlans.quantityOverRemaining', {
                            remaining: formatNumber(remaining, locale),
                          })}
                        </p>
                      </div>
                    </div>
                  </aside>
                ) : null}
              </div>
              {showMaleCapacity || showFemaleCapacity ? (
                <div className="grid gap-2">
                  {showMaleCapacity && selectedAccommodation ? (
                    <FormFactTile
                      icon={Mars}
                      label={t('accommodations.maleCapacity')}
                      value={formatNumber(selectedAccommodation.maleCapacity, locale)}
                      tone="teal"
                    />
                  ) : null}
                  {showFemaleCapacity && selectedAccommodation ? (
                    <FormFactTile
                      icon={Venus}
                      label={t('accommodations.femaleCapacity')}
                      value={formatNumber(selectedAccommodation.femaleCapacity, locale)}
                      tone="mint"
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            <FormActions
              submitting={add.isPending}
              submitLabel={t('restaurantMealPlans.distributeToAccommodation')}
            />
          </AppForm>
        )}
      </FormCard>

      <FormCard
        icon={Building2}
        title={t('restaurantMealPlans.receivingAccommodations', {
          food: item.food.name,
          mealType: t(`restaurantMealPlans.mealTypes.${item.mealType}`),
        })}
        action={
          rows.length ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="soft" disabled={publishing} onClick={() => void publishList()}>
                <ImageDown className="size-4" aria-hidden />
                {t('restaurantMealPlans.publishList')}
              </Button>
              <Button type="button" variant="soft" onClick={() => setSmsAllOpen(true)}>
                <MessageSquare className="size-4" aria-hidden />
                {t('restaurantMealPlans.smsAll')}
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="p-5 sm:p-6">
          {rows.length ? (
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-sm">
                <thead className="bg-cream-50 text-ink-700">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('restaurantMealPlans.accommodation')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('restaurantMealPlans.managerName')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('restaurantMealPlans.nationalId')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">
                      {t('restaurantMealPlans.quantity')}
                    </th>
                    <th className="px-3 py-2 text-start font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const manager = primaryManager(row)
                    return (
                      <tr key={row.id} className="border-t border-line">
                        <td className="px-3 py-2">
                          <div>{row.accommodation.name}</div>
                          <div className="mt-0.5 text-xs text-ink-500">
                            {t(`managementTypes.${row.accommodation.managementType}`)}
                          </div>
                        </td>
                        <td className="px-3 py-2">{manager?.user?.fullName ?? '—'}</td>
                        <td className="px-3 py-2">
                          {manager?.user?.nationalId ? (
                            <CopyableDigits value={manager.user.nationalId} />
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-3 py-2">{formatNumber(row.servings, locale)}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => openRowSms(row)}
                            >
                              <MessageSquare className="size-4" aria-hidden />
                              {t('restaurantMealPlans.sms')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              icon
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                              aria-label={t('common.delete')}
                              title={t('common.delete')}
                              onClick={() =>
                                confirmDelete({
                                  message: t('restaurantMealPlans.confirmDeleteDistribution'),
                                  successMessage: t('restaurantMealPlans.distributionDeleted'),
                                  path: `/restaurant-meal-plans/${id}/distributions/${row.id}`,
                                  queryKey: ['restaurant-meal-plan-distributions'],
                                  onDeleted: () => {
                                    void queryClient.invalidateQueries({
                                      queryKey: [
                                        'restaurant-meal-plan-distribution-accommodations',
                                        id,
                                      ],
                                    })
                                    void queryClient.invalidateQueries({
                                      queryKey: ['restaurant-meal-plans'],
                                    })
                                    void queryClient.invalidateQueries({
                                      queryKey: ['restaurant-meal-plan', id],
                                    })
                                  },
                                })
                              }
                            >
                              <Trash2 className="size-4" aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <FormEmptyHint>{t('restaurantMealPlans.emptyDistributions')}</FormEmptyHint>
          )}
        </div>
      </FormCard>
      {publishing
        ? createPortal(
            <div className="pointer-events-none fixed inset-0 z-[80] flex items-start justify-center bg-white">
              <div
                ref={listRef}
                dir={languageDir(locale)}
                className="w-[720px] bg-white p-5 text-[#3f3a34]"
              >
                <p className="text-base font-semibold text-[#3f3a34]">
                  {t('restaurantMealPlans.receivingAccommodations', {
                    food: item.food.name,
                    mealType: t(`restaurantMealPlans.mealTypes.${item.mealType}`),
                  })}
                </p>
                <p className="mt-1 text-sm text-[#6b635b]">
                  {item.restaurant.name}
                  {' · '}
                  <DateText value={item.planDate} />
                </p>
                <table className="mt-3 w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border border-[#d9d2c8] bg-[#f6f1e8] px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.accommodation')}
                      </th>
                      <th className="border border-[#d9d2c8] bg-[#f6f1e8] px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.managerName')}
                      </th>
                      <th className="border border-[#d9d2c8] bg-[#f6f1e8] px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.nationalId')}
                      </th>
                      <th className="border border-[#d9d2c8] bg-[#f6f1e8] px-3 py-2 text-start font-medium">
                        {t('restaurantMealPlans.quantity')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const manager = primaryManager(row)
                      return (
                      <tr key={row.id}>
                        <td className="border border-[#d9d2c8] px-3 py-2">{row.accommodation.name}</td>
                        <td className="border border-[#d9d2c8] px-3 py-2">
                          {manager?.user?.fullName ?? '—'}
                        </td>
                        <td className="border border-[#d9d2c8] px-3 py-2">
                          {manager?.user?.nationalId
                            ? localizeDigits(manager.user.nationalId, locale)
                            : '—'}
                        </td>
                        <td className="border border-[#d9d2c8] px-3 py-2">
                          {formatNumber(row.servings, locale)}
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>,
            document.body,
          )
        : null}
      {smsOpen ? (
        <SmsPreviewModal
          title={t('restaurantMealPlans.smsPreviewTitle')}
          phone={smsPhone}
          body={smsBody}
          sending={sendingSms}
          onPhoneChange={setSmsPhone}
          onBodyChange={setSmsBody}
          onClose={() => setSmsOpen(false)}
          onSend={sendRowSms}
        />
      ) : null}
      {smsAllOpen ? (
        <MealPlanDistributionSmsAllModal
          locale={locale}
          items={rows}
          sending={sendingSms}
          onClose={() => setSmsAllOpen(false)}
          onSend={sendAllSms}
        />
      ) : null}
    </div>
  )
}
