export const caravanContactRoles = [
  'DEPUTY',
  'CLERIC',
  'CULTURAL',
  'SECURITY',
  'RECEPTION',
] as const

export type CaravanContactRole = (typeof caravanContactRoles)[number]

export type CaravanContactDraft = {
  nationalId: string
  firstName: string
  lastName: string
  phone: string
  birthDate: string
  userId?: string
  /** idle: only national id; looking: searching; found: existing user; new: create fields */
  status: 'idle' | 'looking' | 'found' | 'new'
}

export type CaravanContactPayload = {
  role: CaravanContactRole
  nationalId: string
  firstName: string
  lastName: string
  phone: string
  birthDate: string | null
}

export function emptyContactDraft(): CaravanContactDraft {
  return {
    nationalId: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    status: 'idle',
  }
}

export function contactDraftsFromInitial(
  contacts?: Array<{
    role: CaravanContactRole
    user: {
      id: string
      firstName: string
      lastName: string
      nationalId: string | null
      phone: string | null
      birthDate?: string | null
    }
  }>,
): Record<CaravanContactRole, CaravanContactDraft> {
  const drafts = Object.fromEntries(
    caravanContactRoles.map((role) => [role, emptyContactDraft()]),
  ) as Record<CaravanContactRole, CaravanContactDraft>

  for (const item of contacts ?? []) {
    drafts[item.role] = {
      nationalId: item.user.nationalId ?? '',
      firstName: item.user.firstName,
      lastName: item.user.lastName,
      phone: item.user.phone ?? '',
      birthDate: item.user.birthDate?.slice(0, 10) ?? '',
      userId: item.user.id,
      status: 'found',
    }
  }

  return drafts
}

export function toContactPayloads(
  drafts: Record<CaravanContactRole, CaravanContactDraft>,
): CaravanContactPayload[] {
  return caravanContactRoles.flatMap((role) => {
    const draft = drafts[role]
    if (!draft.nationalId.trim()) return []
    if (draft.status !== 'found' && draft.status !== 'new') return []
    if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.phone.trim()) {
      return []
    }
    if (draft.status === 'new' && !draft.birthDate.trim()) return []
    return [
      {
        role,
        nationalId: draft.nationalId.trim(),
        firstName: draft.firstName.trim(),
        lastName: draft.lastName.trim(),
        phone: draft.phone.trim(),
        birthDate: draft.birthDate.trim() || null,
      },
    ]
  })
}

export function isContactComplete(draft: CaravanContactDraft) {
  if (!draft.nationalId.trim()) return false
  if (draft.status !== 'found' && draft.status !== 'new') return false
  if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.phone.trim()) {
    return false
  }
  if (draft.status === 'new' && !draft.birthDate.trim()) return false
  return true
}

export function isContactIncomplete(draft: CaravanContactDraft) {
  const hasAny =
    draft.nationalId.trim() ||
    draft.firstName.trim() ||
    draft.lastName.trim() ||
    draft.phone.trim() ||
    draft.birthDate.trim()
  if (!hasAny) return false
  return !isContactComplete(draft)
}
