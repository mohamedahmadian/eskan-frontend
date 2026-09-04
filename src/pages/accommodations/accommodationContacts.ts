export const accommodationContactRoles = [
  'DEPUTY',
  'RECEPTION',
  'FACILITIES_SAFETY',
  'SECURITY',
  'HEALTH',
  'CULTURAL',
  'LOGISTICS_SUPPORT',
] as const

export type AccommodationContactRole = (typeof accommodationContactRoles)[number]

export type AccommodationContactDraft = {
  nationalId: string
  firstName: string
  lastName: string
  phone: string
  birthDate: string
  userId?: string
  status: 'idle' | 'looking' | 'found' | 'new'
}

export type AccommodationContactPayload = {
  role: AccommodationContactRole
  userId?: string
  nationalId: string
  firstName: string
  lastName: string
  phone: string
  birthDate: string | null
}

export function emptyAccommodationContactDraft(): AccommodationContactDraft {
  return {
    nationalId: '',
    firstName: '',
    lastName: '',
    phone: '',
    birthDate: '',
    status: 'idle',
  }
}

export function accommodationContactDraftsFromInitial(
  contacts?: Array<{
    role: AccommodationContactRole
    user: {
      id: string
      firstName: string
      lastName: string
      nationalId: string | null
      phone: string | null
      birthDate?: string | null
    }
  }>,
): Record<AccommodationContactRole, AccommodationContactDraft> {
  const drafts = Object.fromEntries(
    accommodationContactRoles.map((role) => [role, emptyAccommodationContactDraft()]),
  ) as Record<AccommodationContactRole, AccommodationContactDraft>

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

export function toAccommodationContactPayloads(
  drafts: Record<AccommodationContactRole, AccommodationContactDraft>,
): AccommodationContactPayload[] {
  return accommodationContactRoles.flatMap((role) => {
    const draft = drafts[role]
    if (draft.userId) {
      return [
        {
          role,
          userId: draft.userId,
          nationalId: draft.nationalId.trim(),
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          phone: draft.phone.trim(),
          birthDate: draft.birthDate.trim() || null,
        },
      ]
    }
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

export function isAccommodationContactComplete(draft: AccommodationContactDraft) {
  if (!draft.nationalId.trim()) return false
  if (draft.status !== 'found' && draft.status !== 'new') return false
  if (!draft.firstName.trim() || !draft.lastName.trim() || !draft.phone.trim()) {
    return false
  }
  if (draft.status === 'new' && !draft.birthDate.trim()) return false
  return true
}

export function isAccommodationContactAssigned(draft: AccommodationContactDraft) {
  if (draft.userId) return true
  if (draft.status === 'found' && (draft.firstName.trim() || draft.lastName.trim())) {
    return true
  }
  return isAccommodationContactComplete(draft)
}
