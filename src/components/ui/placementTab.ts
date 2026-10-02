export function placementTabClassName(active: boolean) {
  return active
    ? 'bg-mint-500 font-bold text-white shadow-[0_8px_18px_rgba(63,214,190,0.45)] ring-2 ring-mint-300'
    : 'border-2 border-mint-400 bg-mint-50 font-bold text-ink-900 shadow-[0_4px_12px_rgba(63,214,190,0.28)] hover:bg-mint-100'
}

export const placementPanelClassName =
  'space-y-4 rounded-2xl border-2 border-mint-400 bg-gradient-to-b from-mint-50 to-white p-4 shadow-[0_10px_24px_rgba(63,214,190,0.16)]'
