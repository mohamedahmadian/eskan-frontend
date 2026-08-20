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
  roles: Pick<RoleOption, 'code' | 'nameKey'>[]
  modules: NavModule[]
}

export type Caravan = {
  id: string
  name: string
  originCity: string
  plannedArrival: string | null
  createdAt: string
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
  userId: string
  isPrimary: boolean
  year: number
  createdAt: string
  user: { id: string; username: string; fullName: string }
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
  total: number
  byGenderType: { genderType: GenderType; count: number }[]
  byManagementType: { managementType: ManagementType; count: number }[]
  byCombination: {
    genderType: GenderType
    managementType: ManagementType
    count: number
  }[]
}

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
