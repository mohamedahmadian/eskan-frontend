import { useQuery, useQueryClient } from '@tanstack/react-query'
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
  Tag,
  ToggleRight,
} from 'lucide-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  ToggleField,
  fieldClassName,
} from '../../components/ui/Form'
import { FormCard, formCardBodyClassName } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { findAnonymousBenefactor, isAnonymousBenefactor } from '../../lib/benefactors'
import { formatGroupedNumber, parseDigitString } from '../../lib/datetime'
import type {
  Benefactor,
  Contribution,
  ContributionGood,
  ContributionType,
  GoodsUnit,
  ParticipationCampaign,
} from '../../types/app'

export type ContributionPayload = {
  type: ContributionType
  benefactorId: string
  amount: number
  quantity: number | null
  goodsId: string | null
  unitId: string | null
  campaignId: string | null
  shareCount: number | null
  trackingCode: string | null
  description: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function splitBenefactorName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return null
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function pieceUnitId(units: GoodsUnit[] | undefined) {
  return units?.find((item) => item.isActive && item.name === 'عدد')?.id
    ?? units?.find((item) => item.name === 'عدد')?.id
    ?? ''
}

function sharesFromAmount(amount: number, sharePrice: number) {
  if (!(sharePrice > 0) || !Number.isFinite(amount) || amount <= 0) return ''
  const shares = Math.floor(amount / sharePrice)
  return shares > 0 ? String(shares) : ''
}

function amountFromShares(shares: number, sharePrice: number) {
  if (!(sharePrice > 0) || !Number.isFinite(shares) || shares <= 0) return null
  return String(shares * sharePrice)
}

export function ContributionForm({
  initial,
  lockedCampaignId,
  lockedCampaignName,
  lockedCampaignSharePrice,
  onSubmit,
}: {
  initial?: Contribution
  lockedCampaignId?: string
  lockedCampaignName?: string
  lockedCampaignSharePrice?: number
  onSubmit: (payload: ContributionPayload) => Promise<void>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [creatingBenefactor, setCreatingBenefactor] = useState(false)
  const [creatingGood, setCreatingGood] = useState(false)
  const [values, setValues] = useState({
    type: (initial?.type ?? 'CASH') as ContributionType,
    benefactorId: initial?.benefactorId ?? '',
    amount: initial?.amount != null ? String(initial.amount) : '',
    quantity: initial?.quantity != null ? String(initial.quantity) : '',
    goodsId: initial?.goodsId ?? '',
    unitId: initial?.unitId ?? '',
    campaignId: initial?.campaignId ?? lockedCampaignId ?? '',
    shareCount: initial?.shareCount != null ? String(initial.shareCount) : '',
    trackingCode: initial?.trackingCode ?? '',
    description: initial?.description ?? '',
  })

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const benefactors = useQuery({
    queryKey: ['benefactors', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Benefactor[]>('/benefactors')
      return data
    },
  })

  const goods = useQuery({
    queryKey: ['contribution-goods', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ContributionGood[]>('/contribution-goods')
      return data
    },
  })

  const units = useQuery({
    queryKey: ['goods-units', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<GoodsUnit[]>('/goods-units')
      return data
    },
  })

  const campaigns = useQuery({
    queryKey: ['participation-campaigns', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<ParticipationCampaign[]>('/participation-campaigns')
      return data
    },
  })

  const inKind = values.type === 'IN_KIND'
  const selectedCampaign = (campaigns.data ?? []).find((item) => item.id === values.campaignId)
  const showShareCount = Boolean(values.campaignId) && !inKind

  function resolveSharePrice(campaignId: string) {
    if (!campaignId) return undefined
    const fromList = (campaigns.data ?? []).find((item) => item.id === campaignId)?.sharePrice
    if (fromList != null) return fromList
    if (campaignId === lockedCampaignId) return lockedCampaignSharePrice
    if (campaignId === initial?.campaignId) return initial.campaign?.sharePrice
    return undefined
  }

  const sharePrice = resolveSharePrice(values.campaignId)

  function setCampaign(next: string) {
    setValues((current) => {
      const price = resolveSharePrice(next)
      if (!next || price == null) {
        return {
          ...current,
          campaignId: next,
          shareCount: next ? current.shareCount : '',
        }
      }
      const shares = Number(current.shareCount)
      const filledAmount = amountFromShares(shares, price)
      if (filledAmount) {
        return {
          ...current,
          campaignId: next,
          shareCount: current.shareCount,
          amount: filledAmount,
        }
      }
      return {
        ...current,
        campaignId: next,
        shareCount: sharesFromAmount(Number(current.amount), price),
      }
    })
  }

  function setShareCount(next: string) {
    setValues((current) => {
      const price = resolveSharePrice(current.campaignId)
      const filledAmount = price != null ? amountFromShares(Number(next), price) : null
      return {
        ...current,
        shareCount: next,
        amount: filledAmount ?? current.amount,
      }
    })
  }

  function setAmount(next: string) {
    setValues((current) => {
      const price = resolveSharePrice(current.campaignId)
      return {
        ...current,
        amount: next,
        shareCount:
          price != null && next.trim()
            ? sharesFromAmount(Number(next), price)
            : current.shareCount,
      }
    })
  }

  const benefactorOptions = useMemo(() => {
    const items = [...(benefactors.data ?? [])]
    items.sort((left, right) => {
      if (isAnonymousBenefactor(left) && !isAnonymousBenefactor(right)) return -1
      if (isAnonymousBenefactor(right) && !isAnonymousBenefactor(left)) return 1
      return left.name.localeCompare(right.name, 'fa')
    })
    return items
  }, [benefactors.data])

  useEffect(() => {
    if (initial || values.benefactorId) return
    const anonymous = findAnonymousBenefactor(benefactorOptions)
    if (anonymous) set('benefactorId', anonymous.id)
  }, [benefactorOptions, initial, values.benefactorId])

  useEffect(() => {
    if (!inKind || values.unitId) return
    const nextUnitId = pieceUnitId(units.data)
    if (!nextUnitId) return
    setValues((current) =>
      current.type !== 'IN_KIND' || current.unitId
        ? current
        : { ...current, unitId: nextUnitId },
    )
  }, [inKind, units.data, values.unitId])

  async function createBenefactorFromName(fullName: string) {
    const parsed = splitBenefactorName(fullName)
    if (!parsed) {
      toast.error(t('contributions.benefactorNameRequired'))
      return
    }
    if (creatingBenefactor) return
    setCreatingBenefactor(true)
    try {
      const { data } = await api.post<Benefactor>('/benefactors', parsed)
      queryClient.setQueryData<Benefactor[]>(['benefactors', 'lookup'], (current) =>
        current ? [...current, data] : [data],
      )
      await queryClient.invalidateQueries({ queryKey: ['benefactors'] })
      set('benefactorId', data.id)
      toast.success(t('benefactors.created'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setCreatingBenefactor(false)
    }
  }

  async function createGoodFromName(name: string) {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error(t('contributions.goodsNameRequired'))
      return
    }
    if (creatingGood) return
    setCreatingGood(true)
    try {
      const { data } = await api.post<ContributionGood>('/contribution-goods', { name: trimmed })
      queryClient.setQueryData<ContributionGood[]>(['contribution-goods', 'lookup'], (current) =>
        current ? [...current, data] : [data],
      )
      await queryClient.invalidateQueries({ queryKey: ['contribution-goods'] })
      set('goodsId', data.id)
      toast.success(t('contributionGoods.created'))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setCreatingGood(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const shareCountRaw = values.shareCount.trim()
    const shareCount = shareCountRaw ? Number(shareCountRaw) : null
    let amount = values.amount.trim() ? Number(values.amount) : NaN
    if (
      showShareCount &&
      shareCount != null &&
      Number.isFinite(shareCount) &&
      shareCount > 0 &&
      (!Number.isFinite(amount) || amount <= 0) &&
      sharePrice
    ) {
      amount = shareCount * sharePrice
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast.error(t('contributions.amountRequired'))
      return
    }
    if (inKind) {
      const quantity = Number(values.quantity)
      if (!values.goodsId || !values.unitId || !Number.isFinite(quantity) || quantity <= 0) {
        toast.error(t('contributions.inKindRequired'))
        return
      }
    }
    const benefactorId =
      values.benefactorId || findAnonymousBenefactor(benefactors.data)?.id || ''
    if (!benefactorId) {
      toast.error(t('contributions.benefactorNameRequired'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        type: values.type,
        benefactorId,
        amount,
        quantity: inKind ? Number(values.quantity) : null,
        goodsId: inKind ? values.goodsId : null,
        unitId: inKind ? values.unitId : null,
        campaignId: emptyToNull(values.campaignId),
        shareCount: showShareCount && shareCount != null && Number.isFinite(shareCount) ? shareCount : null,
        trackingCode: emptyToNull(values.trackingCode),
        description: emptyToNull(values.description),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormCard
      icon={HandCoins}
      title={initial ? initial.benefactor.name : t('contributions.create')}
      subtitle={initial ? undefined : t('contributions.createSubtitle')}
    >
      <AppForm onSubmit={submit} className={formCardBodyClassName}>
        <FormField icon={HandHeart} label={t('contributions.benefactor')} htmlFor="benefactorId">
          <SearchSelect
            id="benefactorId"
            value={values.benefactorId}
            disabled={creatingBenefactor}
            onChange={(next) => set('benefactorId', next)}
            onCreate={(name) => void createBenefactorFromName(name)}
            createLabel={(name) => t('contributions.createBenefactorNamed', { name })}
            placeholder={t('contributions.selectBenefactor')}
            options={benefactorOptions.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <p className="text-xs text-ink-500">{t('contributions.benefactorOptionalHint')}</p>
        </FormField>

        <FormField icon={ToggleRight} label={t('contributions.type')} htmlFor="type">
          <ToggleField
            id="type"
            checked={values.type === 'CASH'}
            onChange={(checked) => {
              const next: ContributionType = checked ? 'CASH' : 'IN_KIND'
              setValues((current) => ({
                ...current,
                type: next,
                amount:
                  next === 'IN_KIND'
                    ? current.amount === ''
                      ? '0'
                      : current.amount
                    : current.amount,
                goodsId: next === 'CASH' ? '' : current.goodsId,
                quantity: next === 'CASH' ? '' : current.quantity,
                unitId: next === 'CASH' ? '' : current.unitId || pieceUnitId(units.data),
                shareCount: next === 'CASH' ? current.shareCount : '',
              }))
            }}
            onLabel={t('contributions.types.CASH')}
            offLabel={t('contributions.types.IN_KIND')}
          />
        </FormField>

        {inKind ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField icon={Hash} label={t('contributions.quantity')} htmlFor="quantity">
              <input
                id="quantity"
                type="number"
                min="0"
                step="any"
                className={`${fieldClassName} digit-field`}
                value={values.quantity}
                onChange={(event) => set('quantity', event.target.value)}
                required
              />
            </FormField>
            <FormField icon={Scale} label={t('contributions.unit')} htmlFor="unitId">
              <SearchSelect
                id="unitId"
                value={values.unitId}
                required
                onChange={(next) => set('unitId', next)}
                placeholder={t('contributions.selectUnit')}
                options={[
                  { value: '', label: t('contributions.selectUnit') },
                  ...(units.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
          </div>
        ) : null}

        <div className={inKind ? 'grid gap-4 sm:grid-cols-2' : undefined}>
          {inKind ? (
            <FormField icon={Package} label={t('contributions.goods')} htmlFor="goodsId">
              <SearchSelect
                id="goodsId"
                value={values.goodsId}
                required
                disabled={creatingGood}
                onChange={(next) => set('goodsId', next)}
                onCreate={(name) => void createGoodFromName(name)}
                createLabel={(name) => t('contributions.createGoodsNamed', { name })}
                placeholder={t('contributions.selectGoods')}
                options={[
                  { value: '', label: t('contributions.selectGoods') },
                  ...(goods.data ?? []).map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
            </FormField>
          ) : null}
          <FormField
            icon={Banknote}
            label={t(inKind ? 'contributions.estimatedValue' : 'contributions.amount')}
            htmlFor="amount"
          >
            <div className="relative">
              <input
                id="amount"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={`${fieldClassName} digit-field pe-16`}
                value={
                  values.amount === ''
                    ? ''
                    : formatGroupedNumber(Number(values.amount), locale)
                }
                onChange={(event) => setAmount(parseDigitString(event.target.value))}
                required={!showShareCount}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                {t('participations.toman')}
              </span>
            </div>
          </FormField>
        </div>

        <FormField icon={Megaphone} label={t('contributions.campaign')} htmlFor="campaignId">
          {lockedCampaignId ? (
            <p className="rounded-xl border border-line bg-cream-50 px-3 py-2.5 text-sm text-ink-800">
              {selectedCampaign?.name ?? lockedCampaignName ?? t('contributions.selectCampaign')}
            </p>
          ) : (
            <SearchSelect
              id="campaignId"
              value={values.campaignId}
              onChange={setCampaign}
              placeholder={t('contributions.selectCampaign')}
              options={[
                { value: '', label: t('contributions.noCampaign') },
                ...(campaigns.data ?? []).map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
          )}
        </FormField>

        {showShareCount ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField icon={Tag} label={t('contributions.sharePrice')} htmlFor="sharePrice">
              <div className="relative">
                <input
                  id="sharePrice"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  className={`${fieldClassName} digit-field pe-16 bg-cream-50`}
                  value={sharePrice != null ? formatGroupedNumber(sharePrice, locale) : ''}
                />
                <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-400">
                  {t('participations.toman')}
                </span>
              </div>
            </FormField>
            <FormField icon={Coins} label={t('contributions.shareCount')} htmlFor="shareCount">
              <input
                id="shareCount"
                type="number"
                min={1}
                className={`${fieldClassName} digit-field`}
                value={values.shareCount}
                onChange={(event) => setShareCount(event.target.value)}
              />
            </FormField>
            <p className="text-xs text-ink-500 sm:col-span-2">{t('contributions.shareCountHint')}</p>
          </div>
        ) : null}

        <FormField icon={Hash} label={t('contributions.trackingCode')} htmlFor="trackingCode">
          <input
            id="trackingCode"
            className={`${fieldClassName} digit-field`}
            value={values.trackingCode}
            onChange={(event) => set('trackingCode', event.target.value)}
          />
        </FormField>

        <FormField icon={AlignLeft} label={t('contributions.description')} htmlFor="description">
          <textarea
            id="description"
            className={fieldClassName}
            rows={4}
            value={values.description}
            onChange={(event) => set('description', event.target.value)}
          />
        </FormField>

        <FormActions
          submitLabel={t('contributions.save')}
          cancelLabel={t('contributions.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </AppForm>
    </FormCard>
  )
}
