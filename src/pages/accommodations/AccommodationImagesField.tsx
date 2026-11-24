import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { FileDropField } from '../../components/ui/FileDropField'
import { Button, fileRemoveButtonClassName } from '../../components/ui/Form'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import { optimizeImageFile } from '../../lib/optimize-image'

const MAX_ACCOMMODATION_IMAGES = 12

export function AccommodationImagesField({
  imageIds,
  onChange,
  uploadPath = '/images',
  maxImages = MAX_ACCOMMODATION_IMAGES,
  emptyLabel,
  limitLabel,
  capture,
}: {
  imageIds: string[]
  onChange: (imageIds: string[]) => void
  uploadPath?: string
  maxImages?: number
  emptyLabel?: string
  limitLabel?: string
  capture?: 'user' | 'environment'
}) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const emptyText = emptyLabel ?? t('accommodations.noImages')
  const limitText = limitLabel ?? t('accommodations.imagesLimit')
  const atLimit = imageIds.length >= maxImages

  async function uploadImage(file: File) {
    if (atLimit) {
      toast.error(limitText)
      return
    }
    setUploading(true)
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>(uploadPath, body)
      onChange([...imageIds, data.id])
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {imageIds.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {imageIds.map((id) => (
            <li
              key={id}
              className="relative overflow-hidden rounded-2xl border border-line bg-cream-50"
            >
              <a href={getImageUrl(id)} target="_blank" rel="noreferrer">
                <img
                  src={getImageUrl(id)}
                  alt=""
                  className="h-32 w-full object-cover"
                />
              </a>
              <Button
                type="button"
                variant="pink"
                className={`absolute start-2 top-2 ${fileRemoveButtonClassName}`}
                onClick={() => onChange(imageIds.filter((item) => item !== id))}
              >
                <Trash2 className="size-3" aria-hidden />
                {t('common.removeFile')}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-500">
          {emptyText}
        </p>
      )}
      {atLimit ? (
        <p className="text-sm text-ink-500">{limitText}</p>
      ) : (
        <FileDropField
          accept="image/*"
          capture={capture}
          uploading={uploading}
          onFile={(file) => void uploadImage(file)}
        />
      )}
    </div>
  )
}

export function AccommodationImagesGallery({
  imageIds,
  empty,
}: {
  imageIds: string[]
  empty: string
}) {
  const { t } = useTranslation()
  if (!imageIds.length) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-ink-500">
        {empty || t('accommodations.noImages')}
      </p>
    )
  }
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {imageIds.map((id) => (
        <li key={id} className="overflow-hidden rounded-2xl border border-line bg-cream-50">
          <a href={getImageUrl(id)} target="_blank" rel="noreferrer">
            <img src={getImageUrl(id)} alt="" className="h-36 w-full object-cover" />
          </a>
        </li>
      ))}
    </ul>
  )
}

export { MAX_ACCOMMODATION_IMAGES }
