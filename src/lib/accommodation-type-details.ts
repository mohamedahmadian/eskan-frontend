import type {
  Accommodation,
  AccommodationTypeDetailKind,
  AccommodationTypeDetails,
  AccommodationTypeRef,
  RoomCapacityRow,
  TimeRangeRow,
} from '../types/app'
import {
  approvalTriStates,
  assemblyCenterKinds,
  boardingCenterKinds,
  cleaningServiceKinds,
  conditionStatuses,
  drainageStatuses,
  emergencyExitStatuses,
  flooringConditions,
  kitchenStatuses,
  lightingStatuses,
  linenSupplyStatuses,
  lodgingCenterKinds,
  medicalActivityStatuses,
  mosqueManagerLocationKinds,
  schoolKinds,
  sportsComplexKinds,
  tentFlooringKinds,
  tentStructureKinds,
  unknownSuitabilityStatuses,
  waterSourceKinds,
  windResistanceStatuses,
} from '../types/app'

export const medicalDetailKeys = [
  'medicalActivityStatus',
  'medicalAllowedSections',
  'medicalForbiddenSections',
  'medicalWrittenApprovalImageId',
  'medicalHygieneSafetyStatus',
  'medicalApprovedCapacity',
  'medicalSanitaryFacilities',
  'medicalSpecializedRestrictions',
  'medicalApproverName',
] as const

export const boardingDetailKeys = [
  'boardingCenterKind',
  'boardingBlockCount',
  'boardingRoomCount',
  'boardingFixedBedCount',
  'boardingUsableBedCount',
  'boardingPrivateBathroomRoomCount',
  'boardingSharedBathToiletCount',
  'boardingHasDiningHall',
  'boardingHasKitchen',
  'boardingHasLaundry',
  'boardingHasStudyOrHall',
  'boardingAccessControl',
  'boardingPersonalStorage',
  'boardingCanAssignFully',
  'boardingUnassignableSections',
  'boardingApprovedCapacity',
  'boardingRepresentativeName',
] as const

export const tentDetailKeys = [
  'tentStructureKind',
  'tentInstalledCount',
  'tentIntactCount',
  'tentApprovedCapacityEach',
  'tentAreaEach',
  'tentFlooringKind',
  'tentDrainageStatus',
  'tentWindResistanceStatus',
  'tentHvacStatus',
  'tentWaterSource',
  'tentWaterHealthStatus',
  'tentToiletCount',
  'tentWasteLocation',
  'tentPublicLighting',
  'tentExitPathLighting',
  'tentEmergencyVehicleAccess',
  'tentSafeAssemblyPoint',
  'tentFireEquipment',
  'tentMaintenanceManager',
  'tentFinalApprovedCapacity',
] as const

export const lodgingDetailKeys = [
  'lodgingCenterKind',
  'lodgingBuildingCount',
  'lodgingFloorCount',
  'lodgingRoomCount',
  'lodgingFixedBedCount',
  'lodgingUsableBedCount',
  'lodgingSingleRoomCount',
  'lodgingMultiRoomCount',
  'lodgingRoomCapacities',
  'lodgingAssignableRoomCount',
  'lodgingOutOfServiceRoomCount',
  'lodgingPrivateBathroomCount',
  'lodgingSharedBathroomCount',
  'lodgingBathCount',
  'lodgingLinenStatus',
  'lodgingCanWashLinen',
  'lodgingHvacStatus',
  'lodgingElevatorCount',
  'lodgingElevatorStatus',
  'lodgingStepFreeAccess',
  'lodgingLuggageStorage',
  'lodgingCleaningService',
  'lodgingNightReception',
  'lodgingLockStatus',
  'lodgingOperationTerms',
  'lodgingRoomEquipment',
  'lodgingFinalApprovedCapacity',
] as const

export const assemblyDetailKeys = [
  'assemblyCenterKind',
  'assemblyMainHallArea',
  'assemblySideHallCount',
  'assemblyFixedSeatCount',
  'assemblySeatsRemovable',
  'assemblyUsableAreaAfterRemoval',
  'assemblySideRoomCount',
  'assemblyHasStage',
  'assemblyHasBackstage',
  'assemblyToiletCount',
  'assemblyAvSystem',
  'assemblyVentilationStatus',
  'assemblyAvStorage',
  'assemblyEventSchedule',
  'assemblyCanSplitSpace',
  'assemblyFinalApprovedCapacity',
  'assemblyOperatorRestrictions',
] as const

export const sportsDetailKeys = [
  'sportsComplexKind',
  'sportsOperatorName',
  'sportsMainFloorArea',
  'sportsIndependentHallCount',
  'sportsSpectatorSeatCount',
  'sportsSpectatorStayUse',
  'sportsShowerCount',
  'sportsToiletCount',
  'sportsEntryExitCount',
  'sportsEmergencyExitStatus',
  'sportsFlooringCondition',
  'sportsFloorCovering',
  'sportsHasEquipmentStorage',
  'sportsVentilation',
  'sportsHvacStatus',
  'sportsEmergencyLighting',
  'sportsFireStatus',
  'sportsProposedCapacity',
  'sportsFinalApprovedCapacity',
  'sportsHasReceptionDesk',
] as const

export const husseiniehDetailKeys = [
  'husseiniehManagerName',
  'husseiniehMainHallArea',
  'husseiniehSideHallCount',
  'husseiniehSideHallAreas',
  'husseiniehFloorCount',
  'husseiniehBalconyCount',
  'husseiniehBalconyStayUse',
  'husseiniehMainHallCapacity',
  'husseiniehSideRoomCount',
  'husseiniehHasStaffRoom',
  'husseiniehHasStorage',
  'husseiniehHasKitchen',
  'husseiniehKitchenStatus',
  'husseiniehAudioStatus',
  'husseiniehCeremonyHours',
  'husseiniehGenderSeparation',
  'husseiniehToiletStatus',
  'husseiniehVentilationStatus',
  'husseiniehCanBringSupplies',
  'husseiniehTrusteeRestrictions',
] as const

export const mosqueDetailKeys = [
  'mosqueTrusteeName',
  'mosqueHallCount',
  'mosqueFloorCount',
  'mosqueAssignableArea',
  'mosqueHallApprovedCapacity',
  'mosqueHasSistersSpace',
  'mosqueHasBrothersSpace',
  'mosqueBanHours',
  'mosqueReligiousSchedule',
  'mosqueToiletCount',
  'mosqueAblutionCount',
  'mosqueHotWaterStatus',
  'mosqueHasShoeStorage',
  'mosqueHasStorage',
  'mosqueKitchenRestriction',
  'mosqueSpeakerRestriction',
  'mosqueTrusteeRules',
  'mosqueManagerLocationKind',
  'mosqueManagerLocationText',
] as const

export const schoolDetailKeys = [
  'schoolKind',
  'schoolFloorCount',
  'schoolBuildingCount',
  'schoolTotalClassroomCount',
  'schoolUsableClassroomCount',
  'schoolUsableHallCount',
  'schoolPrayerRoomCount',
  'schoolAssignableOfficeCount',
  'schoolClassroomApprovedCapacity',
  'schoolAllowedStayFloors',
  'schoolToiletCount',
  'schoolWashStatus',
  'schoolHvacStatus',
  'schoolManagerUserId',
  'schoolManagerName',
  'schoolEquipmentHandoverImageId',
  'schoolFinalHandoverImageId',
] as const

export const typeDetailKeysByKind = {
  medical: medicalDetailKeys,
  boarding: boardingDetailKeys,
  tent: tentDetailKeys,
  lodging: lodgingDetailKeys,
  'assembly-hall': assemblyDetailKeys,
  'sports-hall': sportsDetailKeys,
  husseinieh: husseiniehDetailKeys,
  mosque: mosqueDetailKeys,
  school: schoolDetailKeys,
} as const

export const allTypeDetailKeys = [
  ...medicalDetailKeys,
  ...boardingDetailKeys,
  ...tentDetailKeys,
  ...lodgingDetailKeys,
  ...assemblyDetailKeys,
  ...sportsDetailKeys,
  ...husseiniehDetailKeys,
  ...mosqueDetailKeys,
  ...schoolDetailKeys,
] as const

const booleanKeys = [
  'boardingHasDiningHall',
  'boardingHasKitchen',
  'boardingHasLaundry',
  'boardingHasStudyOrHall',
  'boardingCanAssignFully',
  'tentEmergencyVehicleAccess',
  'lodgingCanWashLinen',
  'lodgingStepFreeAccess',
  'lodgingNightReception',
  'assemblySeatsRemovable',
  'assemblyHasStage',
  'assemblyHasBackstage',
  'assemblyCanSplitSpace',
  'sportsHasEquipmentStorage',
  'sportsHasReceptionDesk',
  'husseiniehHasStaffRoom',
  'husseiniehHasStorage',
  'husseiniehHasKitchen',
  'husseiniehCanBringSupplies',
  'mosqueHasSistersSpace',
  'mosqueHasBrothersSpace',
  'mosqueHasShoeStorage',
  'mosqueHasStorage',
] as const

const numberKeys = [
  'medicalApprovedCapacity',
  'boardingBlockCount',
  'boardingRoomCount',
  'boardingFixedBedCount',
  'boardingUsableBedCount',
  'boardingPrivateBathroomRoomCount',
  'boardingSharedBathToiletCount',
  'boardingApprovedCapacity',
  'tentInstalledCount',
  'tentIntactCount',
  'tentApprovedCapacityEach',
  'tentAreaEach',
  'tentToiletCount',
  'tentFinalApprovedCapacity',
  'lodgingBuildingCount',
  'lodgingFloorCount',
  'lodgingRoomCount',
  'lodgingFixedBedCount',
  'lodgingUsableBedCount',
  'lodgingSingleRoomCount',
  'lodgingMultiRoomCount',
  'lodgingAssignableRoomCount',
  'lodgingOutOfServiceRoomCount',
  'lodgingPrivateBathroomCount',
  'lodgingSharedBathroomCount',
  'lodgingBathCount',
  'lodgingElevatorCount',
  'lodgingFinalApprovedCapacity',
  'assemblyMainHallArea',
  'assemblySideHallCount',
  'assemblyFixedSeatCount',
  'assemblyUsableAreaAfterRemoval',
  'assemblySideRoomCount',
  'assemblyToiletCount',
  'assemblyFinalApprovedCapacity',
  'sportsMainFloorArea',
  'sportsIndependentHallCount',
  'sportsSpectatorSeatCount',
  'sportsShowerCount',
  'sportsToiletCount',
  'sportsEntryExitCount',
  'sportsProposedCapacity',
  'sportsFinalApprovedCapacity',
  'husseiniehMainHallArea',
  'husseiniehSideHallCount',
  'husseiniehFloorCount',
  'husseiniehBalconyCount',
  'husseiniehMainHallCapacity',
  'husseiniehSideRoomCount',
  'mosqueHallCount',
  'mosqueFloorCount',
  'mosqueAssignableArea',
  'mosqueHallApprovedCapacity',
  'mosqueToiletCount',
  'mosqueAblutionCount',
  'schoolFloorCount',
  'schoolBuildingCount',
  'schoolTotalClassroomCount',
  'schoolUsableClassroomCount',
  'schoolUsableHallCount',
  'schoolPrayerRoomCount',
  'schoolAssignableOfficeCount',
  'schoolClassroomApprovedCapacity',
  'schoolAllowedStayFloors',
  'schoolToiletCount',
] as const

const tableKeys = [
  'lodgingRoomCapacities',
  'husseiniehCeremonyHours',
  'mosqueBanHours',
] as const

type BooleanKey = (typeof booleanKeys)[number]
type NumberKey = (typeof numberKeys)[number]
type TableKey = (typeof tableKeys)[number]

export type RoomCapacityFormRow = { label: string; capacity: string }
export type TimeRangeFormRow = { title: string; startTime: string; endTime: string }

export type TypeDetailFormValues = {
  [K in keyof AccommodationTypeDetails]: K extends BooleanKey
    ? boolean
    : K extends 'lodgingRoomCapacities'
      ? RoomCapacityFormRow[]
      : K extends 'husseiniehCeremonyHours' | 'mosqueBanHours'
        ? TimeRangeFormRow[]
        : string
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toOptionalNumber(value: string) {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function emptyRoomCapacityRow(): RoomCapacityFormRow {
  return { label: '', capacity: '' }
}

export function emptyTimeRangeRow(): TimeRangeFormRow {
  return { title: '', startTime: '', endTime: '' }
}

export function accommodationTypeDetailKind(
  type: AccommodationTypeRef | string | null | undefined,
): AccommodationTypeDetailKind | null {
  const code = typeof type === 'string' ? type : type?.code
  if (code && code in typeDetailKeysByKind) return code as AccommodationTypeDetailKind
  return null
}

export function emptyTypeDetailFormValues(): TypeDetailFormValues {
  const next = {} as TypeDetailFormValues
  for (const key of booleanKeys) next[key] = false
  for (const key of numberKeys) next[key] = ''
  next.lodgingRoomCapacities = []
  next.husseiniehCeremonyHours = []
  next.mosqueBanHours = []
  for (const key of allTypeDetailKeys) {
    if (
      booleanKeys.includes(key as BooleanKey) ||
      numberKeys.includes(key as NumberKey) ||
      tableKeys.includes(key as TableKey)
    ) {
      continue
    }
    next[key] = ''
  }
  return next
}

function asRoomCapacityRows(value: unknown): RoomCapacityFormRow[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => ({
    label: row && typeof row === 'object' && 'label' in row ? String(row.label ?? '') : '',
    capacity:
      row && typeof row === 'object' && 'capacity' in row && row.capacity != null
        ? String(row.capacity)
        : '',
  }))
}

function asTimeRangeRows(value: unknown): TimeRangeFormRow[] {
  if (!Array.isArray(value)) return []
  return value.map((row) => ({
    title: row && typeof row === 'object' && 'title' in row ? String(row.title ?? '') : '',
    startTime:
      row && typeof row === 'object' && 'startTime' in row ? String(row.startTime ?? '') : '',
    endTime: row && typeof row === 'object' && 'endTime' in row ? String(row.endTime ?? '') : '',
  }))
}

export function typeDetailFormValuesFrom(
  initial?: Partial<AccommodationTypeDetails> | Accommodation | null,
): TypeDetailFormValues {
  const next = emptyTypeDetailFormValues()
  if (!initial) return next
  for (const key of booleanKeys) {
    next[key] = Boolean(initial[key])
  }
  for (const key of numberKeys) {
    next[key] = initial[key] == null ? '' : String(initial[key])
  }
  next.lodgingRoomCapacities = asRoomCapacityRows(initial.lodgingRoomCapacities)
  next.husseiniehCeremonyHours = asTimeRangeRows(initial.husseiniehCeremonyHours)
  next.mosqueBanHours = asTimeRangeRows(initial.mosqueBanHours)
  for (const key of allTypeDetailKeys) {
    if (
      booleanKeys.includes(key as BooleanKey) ||
      numberKeys.includes(key as NumberKey) ||
      tableKeys.includes(key as TableKey)
    ) {
      continue
    }
    const value = initial[key]
    next[key] = value == null ? '' : String(value)
  }
  return next
}

export function emptyTypeDetails(): AccommodationTypeDetails {
  const next = {} as AccommodationTypeDetails
  for (const key of allTypeDetailKeys) next[key] = null
  return next
}

function roomCapacitiesPayload(rows: RoomCapacityFormRow[]): RoomCapacityRow[] | null {
  const items = rows
    .map((row) => ({
      label: row.label.trim(),
      capacity: toOptionalNumber(row.capacity),
    }))
    .filter((row) => row.label || row.capacity != null)
  return items.length ? items : null
}

function timeRangesPayload(rows: TimeRangeFormRow[]): TimeRangeRow[] | null {
  const items = rows
    .map((row) => ({
      title: row.title.trim(),
      startTime: row.startTime.trim(),
      endTime: row.endTime.trim(),
    }))
    .filter((row) => row.title || row.startTime || row.endTime)
  return items.length ? items : null
}

export function typeDetailsPayloadFromForm(
  kind: AccommodationTypeDetailKind | null,
  values: TypeDetailFormValues,
): AccommodationTypeDetails {
  const payload = emptyTypeDetails()
  if (!kind) return payload
  const keys = typeDetailKeysByKind[kind]
  for (const key of keys) {
    if (booleanKeys.includes(key as BooleanKey)) {
      payload[key] = values[key] as never
      continue
    }
    if (numberKeys.includes(key as NumberKey)) {
      payload[key] = toOptionalNumber(values[key] as string) as never
      continue
    }
    if (key === 'lodgingRoomCapacities') {
      payload.lodgingRoomCapacities = roomCapacitiesPayload(values.lodgingRoomCapacities)
      continue
    }
    if (key === 'husseiniehCeremonyHours') {
      payload.husseiniehCeremonyHours = timeRangesPayload(values.husseiniehCeremonyHours)
      continue
    }
    if (key === 'mosqueBanHours') {
      payload.mosqueBanHours = timeRangesPayload(values.mosqueBanHours)
      continue
    }
    payload[key] = emptyToNull(values[key] as string) as never
  }
  return payload
}

export const typeDetailSelectOptions = {
  medicalActivityStatus: Object.values(medicalActivityStatuses),
  boardingCenterKind: Object.values(boardingCenterKinds),
  tentStructureKind: Object.values(tentStructureKinds),
  tentFlooringKind: Object.values(tentFlooringKinds),
  tentDrainageStatus: Object.values(drainageStatuses),
  tentWindResistanceStatus: Object.values(windResistanceStatuses),
  tentWaterSource: Object.values(waterSourceKinds),
  tentPublicLighting: Object.values(lightingStatuses),
  tentExitPathLighting: Object.values(lightingStatuses),
  lodgingCenterKind: Object.values(lodgingCenterKinds),
  lodgingLinenStatus: Object.values(linenSupplyStatuses),
  lodgingCleaningService: Object.values(cleaningServiceKinds),
  assemblyCenterKind: Object.values(assemblyCenterKinds),
  assemblyVentilationStatus: Object.values(conditionStatuses),
  sportsComplexKind: Object.values(sportsComplexKinds),
  sportsSpectatorStayUse: Object.values(approvalTriStates),
  sportsEmergencyExitStatus: Object.values(emergencyExitStatuses),
  sportsFlooringCondition: Object.values(flooringConditions),
  sportsEmergencyLighting: Object.values(unknownSuitabilityStatuses),
  husseiniehBalconyStayUse: Object.values(approvalTriStates),
  husseiniehKitchenStatus: Object.values(kitchenStatuses),
  husseiniehAudioStatus: Object.values(conditionStatuses),
  husseiniehVentilationStatus: Object.values(conditionStatuses),
  mosqueHotWaterStatus: Object.values(unknownSuitabilityStatuses),
  mosqueManagerLocationKind: Object.values(mosqueManagerLocationKinds),
  schoolKind: Object.values(schoolKinds),
  schoolWashStatus: Object.values(conditionStatuses),
  schoolHvacStatus: Object.values(conditionStatuses),
} as const
