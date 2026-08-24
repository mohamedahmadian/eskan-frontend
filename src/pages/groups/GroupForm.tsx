import {
  Flag,
  MapPin,
  MapPinned,
  MessageCircle,
  Share2,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  AppForm,
  FormActions,
  FormField,
  cardClassName,
  fieldClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, Country, Group, Province } from '../../types/app'

export type GroupPayload = {
  name: string
  cityId?: string
  maleCount: number
  femaleCount: number
  eitaa: string | null
  bale: string | null
  telegram: string | null
  instagram: string | null
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toCount(value: string) {
  if (value.trim() === '') return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0
}

export function GroupForm({
  initial,
  initialCountryId = '',
  initialProvinceId = '',
  countries,
  provinces,
  cities,
  defaultCountryId,
  defaultProvinceId,
  defaultCityId,
  onCountryChange,
  onProvinceChange,
  onSubmit,
}: {
  initial?: Group
  initialCountryId?: string
  initialProvinceId?: string
  countries: Country[]
  provinces: Province[]
  cities: City[]
  defaultCountryId?: string | null
  defaultProvinceId?: string | null
  defaultCityId?: string | null
  onCountryChange: (countryId: string) => void
  onProvinceChange: (provinceId: string) => void
  onSubmit: (payload: GroupPayload) => Promise<void>
}) {
  const { t } = useTranslation()
  const nameOf = useGeoName()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initial?.name ?? '')
  const [countryId, setCountryId] = useState(
    initial?.city?.province?.countryId ?? initialCountryId,
  )
  const [provinceId, setProvinceId] = useState(
    initial?.city?.provinceId ?? initialProvinceId,
  )
  const [cityId, setCityId] = useState(initial?.cityId ?? '')
  const [maleCount, setMaleCount] = useState(String(initial?.maleCount ?? 0))
  const [femaleCount, setFemaleCount] = useState(String(initial?.femaleCount ?? 0))
  const [eitaa, setEitaa] = useState(initial?.eitaa ?? '')
  const [bale, setBale] = useState(initial?.bale ?? '')
  const [telegram, setTelegram] = useState(initial?.telegram ?? '')
  const [instagram, setInstagram] = useState(initial?.instagram ?? '')
  const geoTouchedRef = useRef(Boolean(initial?.cityId))

  const totalCountValue = toCount(maleCount) + toCount(femaleCount)

  function applyGeoFromProfile(
    nextCountryId?: string | null,
    nextProvinceId?: string | null,
    nextCityId?: string | null,
  ) {
    if (!nextProvinceId || !nextCityId) return
    if (nextCountryId) {
      setCountryId(nextCountryId)
      onCountryChange(nextCountryId)
    }
    setProvinceId(nextProvinceId)
    setCityId(nextCityId)
    onProvinceChange(nextProvinceId)
  }

  useEffect(() => {
    if (initial || geoTouchedRef.current) return
    if (defaultProvinceId && defaultCityId) {
      applyGeoFromProfile(defaultCountryId, defaultProvinceId, defaultCityId)
      geoTouchedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once from profile defaults
  }, [initial, defaultCountryId, defaultProvinceId, defaultCityId])

  async function submit(event: FormEvent) {
    event.preventDefault()
    const resolvedCityId = cityId.trim() || defaultCityId?.trim() || ''
    if (!resolvedCityId) {
      toast.error(t('geo.selectCity'))
      return
    }
    setSaving(true)
    try {
      await onSubmit({
        name: name.trim(),
        cityId: resolvedCityId,
        maleCount: toCount(maleCount),
        femaleCount: toCount(femaleCount),
        eitaa: emptyToNull(eitaa),
        bale: emptyToNull(bale),
        telegram: emptyToNull(telegram),
        instagram: emptyToNull(instagram),
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppForm onSubmit={submit} className="space-y-4">
      <div className={`space-y-4 p-6 ${cardClassName}`}>
        <FormField icon={UsersRound} label={t('groups.name')} htmlFor="name">
          <input
            id="name"
            className={fieldClassName}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField icon={Flag} label={t('geo.country')} htmlFor="countryId">
            <SearchSelect
              id="countryId"
              value={countryId}
              required
              onChange={(next) => {
                setCountryId(next)
                setProvinceId('')
                setCityId('')
                geoTouchedRef.current = true
                onCountryChange(next)
                onProvinceChange('')
              }}
              placeholder={t('geo.selectCountry')}
              options={[
                { value: '', label: t('geo.selectCountry') },
                ...countries.map((country) => ({
                  value: country.id,
                  label: nameOf(country),
                })),
              ]}
            />
          </FormField>

          <FormField icon={MapPinned} label={t('geo.province')} htmlFor="provinceId">
            <SearchSelect
              id="provinceId"
              value={provinceId}
              required
              disabled={!countryId}
              onChange={(next) => {
                setProvinceId(next)
                setCityId('')
                geoTouchedRef.current = true
                onProvinceChange(next)
              }}
              placeholder={t('geo.selectProvince')}
              options={[
                { value: '', label: t('geo.selectProvince') },
                ...provinces.map((province) => ({
                  value: province.id,
                  label: nameOf(province),
                })),
              ]}
            />
          </FormField>

          <FormField icon={MapPin} label={t('groups.city')} htmlFor="cityId">
            <SearchSelect
              id="cityId"
              value={cityId}
              required
              disabled={!provinceId}
              onChange={(next) => {
                setCityId(next)
                geoTouchedRef.current = true
              }}
              placeholder={t('geo.selectCity')}
              options={[
                { value: '', label: t('geo.selectCity') },
                ...cities.map((city) => ({
                  value: city.id,
                  label: nameOf(city),
                })),
              ]}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField icon={UserRound} label={t('groups.maleCount')} htmlFor="maleCount">
            <input
              id="maleCount"
              type="number"
              min={0}
              className={fieldClassName}
              value={maleCount}
              onChange={(e) => setMaleCount(e.target.value)}
            />
          </FormField>
          <FormField icon={UserPlus} label={t('groups.femaleCount')} htmlFor="femaleCount">
            <input
              id="femaleCount"
              type="number"
              min={0}
              className={fieldClassName}
              value={femaleCount}
              onChange={(e) => setFemaleCount(e.target.value)}
            />
          </FormField>
          <FormField icon={Users} label={t('groups.totalCount')} htmlFor="totalCount">
            <input
              id="totalCount"
              type="number"
              className={`${fieldClassName} bg-cream-50 text-ink-700`}
              value={totalCountValue}
              readOnly
              tabIndex={-1}
            />
          </FormField>
        </div>

        <FormField icon={Share2} label={t('groups.eitaa')} htmlFor="eitaa">
          <input
            id="eitaa"
            className={fieldClassName}
            value={eitaa}
            onChange={(e) => setEitaa(e.target.value)}
            dir="ltr"
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('groups.bale')} htmlFor="bale">
          <input
            id="bale"
            className={fieldClassName}
            value={bale}
            onChange={(e) => setBale(e.target.value)}
            dir="ltr"
          />
        </FormField>
        <FormField icon={MessageCircle} label={t('groups.telegram')} htmlFor="telegram">
          <input
            id="telegram"
            className={fieldClassName}
            value={telegram}
            onChange={(e) => setTelegram(e.target.value)}
            dir="ltr"
          />
        </FormField>
        <FormField icon={Share2} label={t('groups.instagram')} htmlFor="instagram">
          <input
            id="instagram"
            className={fieldClassName}
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            dir="ltr"
          />
        </FormField>
      </div>

      <div className={`p-6 ${cardClassName}`}>
        <FormActions
          submitLabel={t('groups.save')}
          cancelLabel={t('groups.cancel')}
          submitting={saving}
          onCancel={() => history.back()}
        />
      </div>
    </AppForm>
  )
}
