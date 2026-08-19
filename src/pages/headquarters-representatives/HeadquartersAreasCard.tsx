import { Map, MapPin, Trash2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { confirmToast } from '../../components/ui/confirmToast'
import {
  AppForm,
  Button,
  FormActions,
  FormField,
  cardClassName,
} from '../../components/ui/Form'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage } from '../../lib/api'
import { useGeoName } from '../../lib/geo'
import type { City, ManagedUser, Province } from '../../types/app'

export function HeadquartersAreasCard({
  user,
  queryKey,
  apiBase,
}: {
  user: ManagedUser
  queryKey: string
  apiBase: string
}) {
  const { t } = useTranslation()
  const geoName = useGeoName()
  const queryClient = useQueryClient()
  const [provinceId, setProvinceId] = useState('')
  const [cityProvinceId, setCityProvinceId] = useState('')
  const [cityId, setCityId] = useState('')

  const assignedProvinceIds = new Set((user.representedProvinces ?? []).map((item) => item.id))
  const assignedCityIds = new Set((user.representedCities ?? []).map((item) => item.id))

  const provinces = useQuery({
    queryKey: ['provinces', 'lookup'],
    queryFn: async () => {
      const { data } = await api.get<Province[]>('/provinces')
      return data
    },
  })

  const cities = useQuery({
    queryKey: ['cities', 'lookup', cityProvinceId],
    enabled: Boolean(cityProvinceId),
    queryFn: async () => {
      const { data } = await api.get<City[]>('/cities', {
        params: { provinceId: cityProvinceId },
      })
      return data
    },
  })

  const freeProvinces = (provinces.data ?? []).filter(
    (item) => !item.representativeId && !assignedProvinceIds.has(item.id),
  )
  const freeCities = (cities.data ?? []).filter(
    (item) =>
      Boolean(item.province.representativeId) &&
      !item.representativeId &&
      !assignedCityIds.has(item.id) &&
      !assignedProvinceIds.has(item.provinceId),
  )

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [queryKey] }),
      queryClient.invalidateQueries({ queryKey: ['provinces'] }),
      queryClient.invalidateQueries({ queryKey: ['cities'] }),
    ])
  }

  const assignProvince = useMutation({
    mutationFn: async () => api.post(`${apiBase}/${user.id}/provinces`, { provinceId }),
    onSuccess: async () => {
      setProvinceId('')
      toast.success(t('headquartersRepresentatives.provinceAssigned'))
      await refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  const assignCity = useMutation({
    mutationFn: async () => api.post(`${apiBase}/${user.id}/cities`, { cityId }),
    onSuccess: async () => {
      setCityId('')
      toast.success(t('headquartersRepresentatives.cityAssigned'))
      await refresh()
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t('common.error')))
    },
  })

  function confirmUnassign(path: string, message: string, successMessage: string) {
    confirmToast({
      title: message,
      confirmLabel: t('common.yesDelete'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        try {
          await api.delete(path)
          toast.success(successMessage)
          await refresh()
        } catch (error) {
          toast.error(getApiErrorMessage(error, t('common.error')))
        }
      },
    })
  }

  return (
    <>
      <article className={`mt-4 p-6 ${cardClassName}`}>
        <h2 className="mb-2 text-base font-semibold text-ink-900">
          {t('headquartersRepresentatives.provinces')}
        </h2>
        <p className="mb-4 text-sm text-ink-500">{t('headquartersRepresentatives.areasHint')}</p>
        {user.representedProvinces?.length ? (
          <ul className="mb-4 space-y-1 text-sm">
            {user.representedProvinces.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-line py-2"
              >
                <span>{geoName(item)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  icon
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={() =>
                    confirmUnassign(
                      `${apiBase}/${user.id}/provinces/${item.id}`,
                      t('headquartersRepresentatives.confirmRemoveProvince'),
                      t('headquartersRepresentatives.provinceRemoved'),
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-ink-500">{t('headquartersRepresentatives.noProvinces')}</p>
        )}
        {freeProvinces.length ? (
          <AppForm
            onSubmit={(event: FormEvent) => {
              event.preventDefault()
              assignProvince.mutate()
            }}
            className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
          >
            <FormField
              icon={Map}
              label={t('headquartersRepresentatives.addProvince')}
              htmlFor="hq-province"
            >
              <SearchSelect
                id="hq-province"
                value={provinceId}
                required
                placeholder={t('geo.selectProvince')}
                onChange={setProvinceId}
                options={freeProvinces.map((item) => ({
                  value: item.id,
                  label: geoName(item),
                }))}
              />
            </FormField>
            <FormActions
              submitLabel={t('headquartersRepresentatives.addProvince')}
              submitting={assignProvince.isPending}
            />
          </AppForm>
        ) : (
          <p className="text-sm text-ink-500">{t('headquartersRepresentatives.noFreeProvinces')}</p>
        )}
      </article>

      <article className={`mt-4 p-6 ${cardClassName}`}>
        <h2 className="mb-4 text-base font-semibold text-ink-900">
          {t('headquartersRepresentatives.cities')}
        </h2>
        {user.representedCities?.length ? (
          <ul className="mb-4 space-y-1 text-sm">
            {user.representedCities.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-line py-2"
              >
                <span>
                  {geoName(item)}
                  {item.province ? ` — ${geoName(item.province)}` : ''}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  icon
                  aria-label={t('common.delete')}
                  title={t('common.delete')}
                  onClick={() =>
                    confirmUnassign(
                      `${apiBase}/${user.id}/cities/${item.id}`,
                      t('headquartersRepresentatives.confirmRemoveCity'),
                      t('headquartersRepresentatives.cityRemoved'),
                    )
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-sm text-ink-500">{t('headquartersRepresentatives.noCities')}</p>
        )}
        <AppForm
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            assignCity.mutate()
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <FormField icon={Map} label={t('geo.province')} htmlFor="hq-city-province">
            <SearchSelect
              id="hq-city-province"
              value={cityProvinceId}
              placeholder={t('geo.selectProvince')}
              onChange={(next) => {
                setCityProvinceId(next)
                setCityId('')
              }}
              options={(provinces.data ?? []).map((item) => ({
                value: item.id,
                label: geoName(item),
              }))}
            />
          </FormField>
          <FormField icon={MapPin} label={t('headquartersRepresentatives.addCity')} htmlFor="hq-city">
            <SearchSelect
              id="hq-city"
              value={cityId}
              required
              disabled={!cityProvinceId}
              placeholder={
                cityProvinceId && !freeCities.length
                  ? t('headquartersRepresentatives.noFreeCities')
                  : t('geo.selectCity')
              }
              onChange={setCityId}
              options={freeCities.map((item) => ({
                value: item.id,
                label: geoName(item),
              }))}
            />
          </FormField>
          <div className="sm:col-span-2">
            <FormActions
              submitLabel={t('headquartersRepresentatives.addCity')}
              submitting={assignCity.isPending}
            />
          </div>
        </AppForm>
      </article>
    </>
  )
}
