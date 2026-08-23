export const userStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const

export type UserStatus = (typeof userStatuses)[keyof typeof userStatuses]

export const userGenders = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const

export type UserGender = (typeof userGenders)[keyof typeof userGenders]

export const religions = {
  ISLAM: 'ISLAM',
  CHRISTIANITY: 'CHRISTIANITY',
  JUDAISM: 'JUDAISM',
  ZOROASTRIANISM: 'ZOROASTRIANISM',
  OTHER: 'OTHER',
} as const

export type Religion = (typeof religions)[keyof typeof religions]

export const accommodationTypes = {
  SCHOOL: 'SCHOOL',
  MOSQUE: 'MOSQUE',
  HUSSEINIEH: 'HUSSEINIEH',
  HALL: 'HALL',
  HOUSE: 'HOUSE',
  OTHER: 'OTHER',
} as const

export type AccommodationType = (typeof accommodationTypes)[keyof typeof accommodationTypes]

export const accommodationStatuses = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  FULL: 'FULL',
} as const

export type AccommodationStatus =
  (typeof accommodationStatuses)[keyof typeof accommodationStatuses]

export const genderTypes = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  MIXED: 'MIXED',
} as const

export type GenderType = (typeof genderTypes)[keyof typeof genderTypes]

export const managementTypes = {
  SELF_SUFFICIENT: 'SELF_SUFFICIENT',
  SEMI_SELF_SUFFICIENT: 'SEMI_SELF_SUFFICIENT',
  NON_SELF_SUFFICIENT: 'NON_SELF_SUFFICIENT',
} as const

export type ManagementType = (typeof managementTypes)[keyof typeof managementTypes]

export const supplierTypes = {
  GOVERNMENT_ORGANIZATION: 'GOVERNMENT_ORGANIZATION',
  CHARITY: 'CHARITY',
  COMPANY: 'COMPANY',
  STORE: 'STORE',
  MANUFACTURER: 'MANUFACTURER',
  WAREHOUSE: 'WAREHOUSE',
  SUPPLIER: 'SUPPLIER',
  OTHER: 'OTHER',
} as const

export type SupplierType = (typeof supplierTypes)[keyof typeof supplierTypes]

export const itemUnits = {
  PIECE: 'PIECE',
  PAIR: 'PAIR',
  SET: 'SET',
  DEVICE: 'DEVICE',
  KILOGRAM: 'KILOGRAM',
  GRAM: 'GRAM',
  TON: 'TON',
  LITER: 'LITER',
  METER: 'METER',
  SQUARE_METER: 'SQUARE_METER',
  CUBIC_METER: 'CUBIC_METER',
  CARTON: 'CARTON',
  PACK: 'PACK',
  BOX: 'BOX',
  BAG: 'BAG',
  ROLL: 'ROLL',
  SHEET: 'SHEET',
  BOLT: 'BOLT',
  BRANCH: 'BRANCH',
  GALLON: 'GALLON',
  CAN: 'CAN',
  OTHER: 'OTHER',
} as const

export type ItemUnit = (typeof itemUnits)[keyof typeof itemUnits]

export function isPresetItemUnit(unit: string): unit is Exclude<ItemUnit, 'OTHER'> {
  return unit in itemUnits && unit !== itemUnits.OTHER
}

export function formatItemUnit(unit: string, t: (key: string) => string) {
  return isPresetItemUnit(unit) ? t(`itemUnits.${unit}`) : unit
}

export type NavMenu = {
  code: string
  nameKey: string
  path: string
  icon: string
  sortOrder: number
}

export type NavModule = {
  code: string
  nameKey: string
  icon: string
  sortOrder: number
  menus: NavMenu[]
}

export type RoleOption = {
  id: string
  code: string
  nameKey: string
}

export type AuthUser = {
  id: string
  username: string
  fullName: string
  locale: string
  gender?: UserGender | null
  provinceId?: string | null
  cityId?: string | null
  countryId?: string | null
  roles: Pick<RoleOption, 'code' | 'nameKey'>[]
  modules: NavModule[]
}

export type Caravan = {
  id: string
  name: string
  description: string | null
  officeAddress: string | null
  officePhone: string | null
  foundedYear: number | null
  licenseNumber: string | null
  cityId: string
  city?: {
    id: string
    nameFa: string
    nameEn: string
    provinceId: string
    province?: {
      id: string
      nameFa: string
      nameEn: string
      countryId: string
      country?: {
        id: string
        nameFa: string
        nameEn: string
      }
    }
  } | null
  licenseImageId: string | null
  managerUserId: string | null
  manager?: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    nationalId: string | null
    phone: string | null
    birthDate?: string | null
    status: UserStatus
  } | null
  contacts?: Array<{
    id: string
    role: 'DEPUTY' | 'CLERIC' | 'CULTURAL' | 'SECURITY' | 'RECEPTION'
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      fullName: string
      nationalId: string | null
      phone: string | null
      birthDate?: string | null
      status: UserStatus
    }
  }>
  eitaa: string | null
  bale: string | null
  telegram: string | null
  instagram: string | null
  totalCount: number
  maleCount: number
  femaleCount: number
  isActive: boolean
  createdAt: string
  managerReused?: boolean
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type ManagedAccommodationLink = {
  id: string
  isPrimary: boolean
  year: number
  createdAt: string
  accommodation: {
    id: string
    name: string
    type?: AccommodationType
    status?: AccommodationStatus
  }
}

export type ManagedUser = {
  id: string
  username: string
  firstName: string
  lastName: string
  fullName: string
  locale: string
  status: UserStatus
  gender: UserGender | null
  nationalId: string | null
  phone: string | null
  birthDate?: string | null
  email: string | null
  address: string | null
  notes: string | null
  religion: Religion | null
  religionOther: string | null
  telegram: string | null
  bale: string | null
  eitaa: string | null
  whatsapp: string | null
  otherSocial: string | null
  vehiclePlates: string[]
  countryId: string | null
  provinceId: string | null
  cityId: string | null
  country: (GeoName & { id: string }) | null
  province: (GeoName & { id: string; countryId: string }) | null
  city: (GeoName & { id: string; provinceId: string }) | null
  photoId: string | null
  nationalCardPhotoId: string | null
  passportPhotoId: string | null
  createdAt: string
  updatedAt: string
  roles: RoleOption[]
  accommodationCount?: number
  representedProvinceCount?: number
  representedCityCount?: number
  representedProvinces?: (GeoName & { id: string })[]
  representedCities?: (GeoName & {
    id: string
    provinceId: string
    province: GeoName & { id: string }
  })[]
  primaryAccommodation?: { id: string; name: string } | null
  accommodations?: ManagedAccommodationLink[]
}

export type GeoName = {
  nameFa: string
  nameEn: string
}

export type Country = GeoName & {
  id: string
  iso2: string
  iso3: string | null
  phoneCode: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  _count?: { provinces: number }
}

export type HeadquartersRepresentativeRef = {
  id: string
  fullName: string
  username: string
}

export type Province = GeoName & {
  id: string
  countryId: string
  code: string
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
  hasRailway: boolean
  hasAirport: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  country: Pick<Country, 'id' | 'iso2' | 'nameFa' | 'nameEn' | 'isActive'>
  representativeId?: string | null
  representative?: HeadquartersRepresentativeRef | null
  _count?: { cities: number }
}

export type City = GeoName & {
  id: string
  provinceId: string
  code: string
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
  isProvinceCapital: boolean
  hasRailway: boolean
  hasAirport: boolean
  isActive: boolean
  sortOrder: number
  createdAt: string
  representativeId?: string | null
  representative?: HeadquartersRepresentativeRef | null
  province: {
    id: string
    code: string
    nameFa: string
    nameEn: string
    isActive: boolean
    countryId: string
    representativeId?: string | null
    representative?: HeadquartersRepresentativeRef | null
    country: Pick<Country, 'id' | 'iso2' | 'nameFa' | 'nameEn' | 'isActive'>
  }
}

export type AccommodationManagerLink = {
  id: string
  userId: string | null
  isPrimary: boolean
  year: number
  createdAt: string
  user: { id: string; username: string; fullName: string } | null
}

export type Accommodation = {
  id: string
  name: string
  type: AccommodationType
  status: AccommodationStatus
  genderType: GenderType
  managementType: ManagementType
  maleCapacity: number
  femaleCapacity: number
  assignedMaleCapacity: number
  assignedFemaleCapacity: number
  phone: string | null
  address: string | null
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
  eitaa: string | null
  bale: string | null
  otherSocial: string | null
  description: string | null
  countryId: string | null
  provinceId: string | null
  cityId: string | null
  country: GeoName & { id: string } | null
  province: GeoName & { id: string; countryId: string } | null
  city: GeoName & { id: string; provinceId: string } | null
  distanceToShrineKm: number | null
  distanceToMashhadKm: number | null
  hasLaundry: boolean
  hasInternet: boolean
  hasPrayerRoom: boolean
  hasElevator: boolean
  heatingSystem: string | null
  coolingSystem: string | null
  parkingCapacity: number | null
  bathroomCount: number | null
  toiletCount: number | null
  managers: AccommodationManagerLink[]
  createdAt: string
  updatedAt: string
}

export type AccommodationReport = {
  year: number
  total: number
  byManagerStatus: {
    withManager: number
    withoutManager: number
  }
  byYearActivity: {
    active: number
    inactive: number
  }
  byType: { type: AccommodationType; count: number }[]
  byGenderType: { genderType: GenderType; count: number }[]
  byManagementType: { managementType: ManagementType; count: number }[]
  byCombination: {
    genderType: GenderType
    managementType: ManagementType
    count: number
  }[]
}

export type AccommodationYearStats = {
  year: number
  total: number
  active: number
  inactive: number
}

export type AccommodationYearRow = Accommodation & {
  activeInYear: boolean
}

export type AccommodationYearTransferResult = {
  sourceYear: number
  targetYear: number
  copyManagers: boolean
  requested: number
  transferred: number
  skipped: number
  errors: { accommodationId: string; message: string }[]
}

export type PilgrimReportNamedCount = {
  id: string
  name: string
  count: number
}

export type PilgrimReportSummary = {
  year: number | null
  total: number
  byGender: {
    male: number
    female: number
    unspecified: number
  }
  byStatus: {
    active: number
    inactive: number
  }
}

export type PilgrimReportGeo = {
  year: number | null
  byCountry: PilgrimReportNamedCount[]
  byProvince: PilgrimReportNamedCount[]
  byCity: PilgrimReportNamedCount[]
}

export type PilgrimReportReligion = {
  year: number | null
  byReligion: { religion: Religion; count: number }[]
}

export type PilgrimReportTimeline = {
  year: number | null
  byYear: { year: number; count: number }[]
  byMonth: { month: number; count: number }[]
}

export type PilgrimReport = PilgrimReportSummary &
  PilgrimReportGeo &
  PilgrimReportReligion &
  Pick<PilgrimReportTimeline, 'byYear' | 'byMonth'>


export type WalkingRouteStage = {
  id?: string
  cityId: string
  city: (GeoName & { id: string; provinceId: string; province: GeoName & { id: string; countryId: string } })
  stageNumber: number
  distanceToNextKm: number | null
  distanceToPreviousKm: number | null
  distanceToMashhadKm: number | null
  description: string | null
}

export type WalkingRoute = {
  id: string
  name: string
  distanceToMashhadKm: number
  entryBorderCityId: string
  entryBorderCity: GeoName & { id: string; provinceId: string; province: GeoName & { id: string; countryId: string } }
  originCountries: (GeoName & { id: string; iso2: string })[]
  stages: WalkingRouteStage[]
  createdAt: string
  updatedAt: string
}

export type FoodSupplier = {
  id: string
  name: string
  phone: string | null
  address: string | null
  description: string | null
  provinceId: string
  cityId: string
  province: GeoName & { id: string; countryId: string }
  city: GeoName & { id: string; provinceId: string }
  createdAt: string
  updatedAt: string
}

export type MedicalCenter = {
  id: string
  name: string
  phone: string | null
  address: string | null
  neshanAddress: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  provinceId: string
  cityId: string
  province: GeoName & { id: string; countryId: string }
  city: GeoName & { id: string; provinceId: string }
  createdAt: string
  updatedAt: string
}

export type RedCrescent = MedicalCenter

export type Benefactor = MedicalCenter

export type Supplier = {
  id: string
  name: string
  type: SupplierType
  address: string | null
  phone: string | null
  contactPerson: string | null
  description: string | null
  createdAt: string
  updatedAt: string
}

export type SupplierItem = {
  id: string
  supplierId: string
  year: number
  name: string
  unit: string
  quantity: number
  remainingQuantity: number
  deliveryDate: string
  returnDate: string | null
  description: string | null
  supplier: Pick<Supplier, 'id' | 'name' | 'type'>
  createdAt: string
  updatedAt: string
}

export type AccommodationLoan = {
  id: string
  supplierItemId: string
  accommodationManagerId: string
  quantity: number
  returnedQuantity: number | null
  shortage: number | null
  deliveryDate: string
  plannedReturnDate: string | null
  actualReturnDate: string | null
  description: string | null
  supplierItem: {
    id: string
    name: string
    unit: string
    year: number
    supplier: { id: string; name: string }
  }
  accommodationManager: { id: string; fullName: string; username: string }
  createdAt: string
  updatedAt: string
}

export type LoanReportItemRow = {
  itemName: string
  unit: string
  received: number
  delivered: number
  returned: number
  unreturned: number
}

export type LoanReportItemStockRow = {
  itemId: string
  itemName: string
  supplierName: string
  quantity: number
  unit: string
  delivered: number
  returned: number
  remaining: number
}

export type LoanReportSupplierRow = {
  supplierId: string
  supplierName: string
  received: number
  delivered: number
  returned: number
  unreturned: number
}

export type LoanReportManagerRow = {
  managerId: string
  managerName: string
  delivered: number
  returned: number
  unreturned: number
}

export type LoanReport = {
  year: number
  receivedFromSuppliers: number
  deliveredToManagers: number
  returned: number
  unreturned: number
  warehouseRemaining: number
  itemStock: LoanReportItemStockRow[]
  byItem: LoanReportItemRow[]
  bySupplier: LoanReportSupplierRow[]
  byManager: LoanReportManagerRow[]
}

export type ItemQuota = {
  id: string
  year: number
  name: string
  unit: string
  quantity: number
  remainingQuantity: number
  supplierId: string | null
  description: string | null
  supplier: Pick<Supplier, 'id' | 'name' | 'type' | 'phone' | 'address'> | null
  createdAt: string
  updatedAt: string
}

export type ItemQuotaVoucher = {
  id: string
  code: string
  quotaId: string
  accommodationManagerId: string
  quantity: number
  supplierId: string | null
  supplierName: string
  pickupLocation: string | null
  description: string | null
  issuedAt: string
  quota: {
    id: string
    year: number
    name: string
    unit: string
    quantity: number
  }
  accommodationManager: {
    id: string
    fullName: string
    username: string
    firstName: string
    lastName: string
    gender: UserGender | null
    nationalId: string | null
    phone: string | null
  }
  supplier: Pick<Supplier, 'id' | 'name' | 'phone' | 'address' | 'type'> | null
  createdAt: string
  updatedAt: string
}

export type ItemQuotaVoucherReportQuotaRow = {
  quotaId: string
  itemName: string
  unit: string
  supplierName: string | null
  quotaQuantity: number
  issuedQuantity: number
  remainingQuantity: number
  voucherCount: number
}

export type ItemQuotaVoucherReportItemRow = {
  itemName: string
  unit: string
  quotaQuantity: number
  issuedQuantity: number
  remainingQuantity: number
  voucherCount: number
}

export type ItemQuotaVoucherReportSupplierRow = {
  supplierId: string | null
  supplierName: string
  voucherCount: number
  issuedQuantity: number
}

export type ItemQuotaVoucherReportManagerRow = {
  managerId: string
  managerName: string
  voucherCount: number
  issuedQuantity: number
}

export type ItemQuotaVoucherReportDay = {
  date: string
  voucherCount: number
  issuedQuantity: number
}

export type ItemQuotaVoucherReport = {
  year: number
  quotaCount: number
  issuedCount: number
  quotaQuantity: number
  issuedQuantity: number
  remainingQuantity: number
  managerCount: number
  supplierCount: number
  byQuota: ItemQuotaVoucherReportQuotaRow[]
  byItem: ItemQuotaVoucherReportItemRow[]
  bySupplier: ItemQuotaVoucherReportSupplierRow[]
  byManager: ItemQuotaVoucherReportManagerRow[]
  byDay: ItemQuotaVoucherReportDay[]
}

export const iceVoucherStatuses = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type IceVoucherStatus = (typeof iceVoucherStatuses)[keyof typeof iceVoucherStatuses]

export const iceVoucherPaymentStatuses = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
} as const

export type IceVoucherPaymentStatus =
  (typeof iceVoucherPaymentStatuses)[keyof typeof iceVoucherPaymentStatuses]

export type IceVoucherSettings = {
  id: string
  moldsPer50Pilgrims: number
  costPerMold: number
  activityStartDate: string | null
  activityEndDate: string | null
}

export type IceVoucherQuota = {
  accommodationId: string
  accommodationName: string
  capacity: number
  moldsPer50Pilgrims: number
  costPerMold: number
  maxMoldCount: number
}

export type IceVoucherAccommodationOption = {
  id: string
  name: string
  maleCapacity: number
  femaleCapacity: number
  managerName: string | null
}

export type IceVoucher = {
  id: string
  code: string
  year: number
  accommodationId: string
  accommodationManagerId: string
  requestedAt: string
  moldCount: number
  costPerMold: number
  totalCost: number
  description: string | null
  status: IceVoucherStatus
  paymentStatus: IceVoucherPaymentStatus
  paidAt: string | null
  approvedAt: string | null
  approvedById: string | null
  accommodation: {
    id: string
    name: string
    maleCapacity: number
    femaleCapacity: number
  }
  accommodationManager: { id: string; fullName: string; username: string; phone: string | null }
  approvedBy: { id: string; fullName: string; username: string } | null
  createdAt: string
  updatedAt: string
}

export type IceVoucherReportDay = {
  date: string
  voucherCount: number
  moldCount: number
  totalCost: number
}

export type IceVoucherReport = {
  year: number
  issuedCount: number
  moldCount: number
  totalCost: number
  paidCount: number
  paidCost: number
  unpaidCount: number
  unpaidCost: number
  byDay: IceVoucherReportDay[]
}

export type IceVoucherStats = {
  year: number
  total: number
  approved: number
  unapproved: number
  paid: number
  unpaid: number
  payableUnpaid?: { id: string; totalCost: number }[]
}

export const reservationTypes = {
  INDIVIDUAL: 'INDIVIDUAL',
  GROUP: 'GROUP',
  CARAVAN: 'CARAVAN',
} as const

export type ReservationType = (typeof reservationTypes)[keyof typeof reservationTypes]

export const reservationStatuses = {
  DRAFT: 'DRAFT',
  PENDING_MANAGEMENT_REVIEW: 'PENDING_MANAGEMENT_REVIEW',
  COMPANIONS: 'COMPANIONS',
  CARAVAN_CONTACTS: 'CARAVAN_CONTACTS',
  INSURANCE: 'INSURANCE',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
} as const

export type ReservationStatus =
  (typeof reservationStatuses)[keyof typeof reservationStatuses]

export const reservationMemberInsuranceStatuses = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type ReservationMemberInsuranceStatus =
  (typeof reservationMemberInsuranceStatuses)[keyof typeof reservationMemberInsuranceStatuses]

export type ReservationInsuranceSummary = {
  total: number
  pending: number
  paid: number
  approved: number
  rejected: number
  completed: boolean
  paidAmount?: number
  lastPaidAt?: string | null
}

export type ReservationPerson = {
  id: string
  firstName: string
  lastName: string
  fullName: string
  nationalId: string | null
  phone: string | null
  gender: UserGender | null
  birthDate: string | null
  status: UserStatus
}

export type ReservationMember = {
  id: string
  user: ReservationPerson
  insuranceStatus: ReservationMemberInsuranceStatus
  insurancePaidAt: string | null
  insurancePaidAmount: number | null
  insurancePaymentRef: string | null
  insuranceManualNote: string | null
}

export type MemberImportRowStatus = 'VALID' | 'INVALID' | 'DUPLICATE'
export type MemberImportUserState = 'NEW' | 'EXISTING' | 'ALREADY_MEMBER'

export type MemberImportPreviewRow = {
  rowNumber: number
  nationalId: string
  firstName: string
  lastName: string
  gender: UserGender | null
  genderText: string
  phone: string | null
  birthDate: string | null
  status: MemberImportRowStatus
  errors: string[]
  duplicateOfRow?: number
  userState: MemberImportUserState
  existingUser?: { fullName: string; gender: UserGender | null }
}

export type MemberImportPreview = {
  total: number
  valid: number
  invalid: number
  duplicate: number
  maleCount: number
  femaleCount: number
  remainingMale: number
  remainingFemale: number
  rows: MemberImportPreviewRow[]
}

export type PreviousReservationMembers = {
  reservation: { id: string; year: number; type: ReservationType } | null
  members: {
    userId: string
    alreadyMember: boolean
    user: ReservationPerson
  }[]
}

export type ReservationCaravanContact = {
  id: string
  role: 'DEPUTY' | 'CLERIC' | 'CULTURAL' | 'SECURITY' | 'RECEPTION'
  user: ReservationPerson
}

export type ReservationListItem = {
  id: string
  year: number
  type: ReservationType
  status: ReservationStatus
  originCity: (GeoName & { id: string; provinceId: string }) | null
  stayStartDate: string | null
  stayEndDate: string | null
  walkingStartDate: string | null
  maleCount: number
  femaleCount: number
  totalCount: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  caravan: { id: string; name: string; managerUserId: string | null } | null
  createdBy?: ReservationPerson
  caravanManager?: ReservationPerson | null
}

export type Reservation = ReservationListItem & {
  createdBy: ReservationPerson
  walkingRoute: { id: string; name: string } | null
  stayStartDate: string | null
  stayEndDate: string | null
  walkingStartDate: string | null
  caravanManager: ReservationPerson | null
  caravanManagerNotes: string | null
  managementNotes: string | null
  rejectionReason: string | null
  basicInfoLockedAt: string | null
  basicInfoCompletedAt: string | null
  managementReviewedAt: string | null
  companionsCompletedAt: string | null
  caravanContactsCompletedAt: string | null
  insuranceCompletedAt: string | null
  cancelledAt: string | null
  rejectedAt: string | null
  returnedToStatus?: ReservationStatus | null
  basicInfoCompletedBy?: ReservationPerson | null
  managementReviewedBy?: ReservationPerson | null
  companionsCompletedBy?: ReservationPerson | null
  caravanContactsCompletedBy?: ReservationPerson | null
  insuranceCompletedBy?: ReservationPerson | null
  completedBy?: ReservationPerson | null
  rejectedBy?: ReservationPerson | null
  cancelledBy?: ReservationPerson | null
  members?: ReservationMember[]
  caravanContacts?: ReservationCaravanContact[]
}

export type ReceptionSettings = {
  year: number
  exists: boolean
  individualEnabled: boolean
  individualMaleCapacity: number
  individualFemaleCapacity: number
  individualAutoApprove: boolean
  groupEnabled: boolean
  groupMaleCapacity: number
  groupFemaleCapacity: number
  groupAutoApprove: boolean
  caravanEnabled: boolean
  caravanMaleCapacity: number
  caravanFemaleCapacity: number
  caravanAutoApprove: boolean
  insuranceOrganization: string
  insurancePremiumAmount: number
  insuranceCoverage: string
}

export type ReceptionCapacitySlice = {
  maleCapacity: number
  femaleCapacity: number
  maleUsed: number
  femaleUsed: number
  maleRemaining: number
  femaleRemaining: number
}

export type ReceptionDashboardTypeSlice = {
  reservations: number
  maleCount: number
  femaleCount: number
  totalCount: number
}

export type ReceptionDashboard = {
  year: number
  totals: {
    all: number
    pendingReview: number
    inProgress: number
    completed: number
    rejected: number
    cancelled: number
  }
  progress: {
    draft: number
    companions: number
    contacts: number
    insurance: number
  }
  types: {
    individual: ReceptionDashboardTypeSlice
    group: ReceptionDashboardTypeSlice
    caravan: ReceptionDashboardTypeSlice
  }
  capacity: ReceptionCapacity
}

export type ReceptionCapacity = {
  year: number
  exists: boolean
  individual: ReceptionCapacitySlice
  group: ReceptionCapacitySlice
  caravan: ReceptionCapacitySlice
}

export type UserHomeReservationTotals = {
  all: number
  inProgress: number
  pendingReview: number
  completed: number
}

export type UserHomeCaravan = {
  id: string
  name: string
  isActive: boolean
  city: GeoName & { id: string; provinceId: string }
}

export type UserHomePilgrim = {
  totals: UserHomeReservationTotals
  recent: ReservationListItem[]
}

export type UserHomeCaravanManager = {
  caravanCount: number
  activeCaravanCount: number
  totals: UserHomeReservationTotals
  recentCaravans: UserHomeCaravan[]
  recentReservations: ReservationListItem[]
}

export type UserHomeDashboard = {
  pilgrim: UserHomePilgrim | null
  caravanManager: UserHomeCaravanManager | null
}
