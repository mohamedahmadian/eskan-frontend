import { AlertTriangle, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './Form'

export function confirmToast({
  title,
  confirmLabel,
  cancelLabel,
  onConfirm,
}: {
  title: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void | Promise<void>
}) {
  toast.custom(
    (id) => (
      <div className="w-[min(100vw-2rem,22rem)] rounded-[22px] border border-white bg-white p-4 shadow-[0_16px_40px_rgba(20,40,40,0.14)]">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="size-5" aria-hidden />
          </div>
          <p className="pt-1.5 text-sm font-medium text-ink-900">{title}</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => toast.dismiss(id)}
          >
            <X className="size-4" aria-hidden />
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              toast.dismiss(id)
              void onConfirm()
            }}
          >
            <Check className="size-4" aria-hidden />
            {confirmLabel}
          </Button>
        </div>
      </div>
    ),
    { duration: Infinity, closeButton: false, unstyled: true },
  )
}
