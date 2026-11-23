import {
  Activity,
  ArrowUpDown,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  Car,
  Clock,
  DoorOpen,
  Droplets,
  FileCheck2,
  Flame,
  HeartPulse,
  Home,
  Lamp,
  Landmark,
  LayoutGrid,
  Mic2,
  Plus,
  School,
  ShieldAlert,
  Shirt,
  Snowflake,
  Tent,
  Trash2,
  UserRound,
  Users,
  UtensilsCrossed,
  Volume2,
  Warehouse,
  Wind,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { FileDropField } from '../../components/ui/FileDropField'
import { Button, FormField, ToggleField, fieldClassName } from '../../components/ui/Form'
import { FormFactTile, FormSectionTitle } from '../../components/ui/FormLayout'
import { SearchSelect } from '../../components/ui/SearchSelect'
import { api, getApiErrorMessage, getImageUrl } from '../../lib/api'
import {
  emptyRoomCapacityRow,
  emptyTimeRangeRow,
  type RoomCapacityFormRow,
  type TimeRangeFormRow,
  type TypeDetailFormValues,
  typeDetailSelectOptions,
} from '../../lib/accommodation-type-details'
import { formatNumber } from '../../lib/datetime'
import { optimizeImageFile } from '../../lib/optimize-image'
import type {
  Accommodation,
  AccommodationTypeDetailKind,
  AccommodationTypeDetails,
  ManagedUser,
} from '../../types/app'
import { toast } from 'sonner'

type FieldKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'file'
  | 'user'
  | 'roomTable'
  | 'timeTable'

type FieldSpec = {
  key: keyof TypeDetailFormValues
  kind: FieldKind
  icon: LucideIcon
  optionsKey?: keyof typeof typeDetailSelectOptions
}

const fieldSpecs: Record<AccommodationTypeDetailKind, FieldSpec[]> = {
  medical: [
    { key: 'medicalActivityStatus', kind: 'select', icon: Activity, optionsKey: 'medicalActivityStatus' },
    { key: 'medicalAllowedSections', kind: 'textarea', icon: LayoutGrid },
    { key: 'medicalForbiddenSections', kind: 'textarea', icon: ShieldAlert },
    { key: 'medicalWrittenApprovalImageId', kind: 'file', icon: FileCheck2 },
    { key: 'medicalHygieneSafetyStatus', kind: 'text', icon: HeartPulse },
    { key: 'medicalApprovedCapacity', kind: 'number', icon: Users },
    { key: 'medicalSanitaryFacilities', kind: 'textarea', icon: Bath },
    { key: 'medicalSpecializedRestrictions', kind: 'textarea', icon: ShieldAlert },
    { key: 'medicalApproverName', kind: 'text', icon: UserRound },
  ],
  boarding: [
    { key: 'boardingCenterKind', kind: 'select', icon: Building2, optionsKey: 'boardingCenterKind' },
    { key: 'boardingBlockCount', kind: 'number', icon: Building2 },
    { key: 'boardingRoomCount', kind: 'number', icon: DoorOpen },
    { key: 'boardingFixedBedCount', kind: 'number', icon: BedDouble },
    { key: 'boardingUsableBedCount', kind: 'number', icon: BedDouble },
    { key: 'boardingPrivateBathroomRoomCount', kind: 'number', icon: Bath },
    { key: 'boardingSharedBathToiletCount', kind: 'number', icon: Droplets },
    { key: 'boardingHasDiningHall', kind: 'boolean', icon: UtensilsCrossed },
    { key: 'boardingHasKitchen', kind: 'boolean', icon: UtensilsCrossed },
    { key: 'boardingHasLaundry', kind: 'boolean', icon: Shirt },
    { key: 'boardingHasStudyOrHall', kind: 'boolean', icon: LayoutGrid },
    { key: 'boardingAccessControl', kind: 'text', icon: DoorOpen },
    { key: 'boardingPersonalStorage', kind: 'text', icon: Warehouse },
    { key: 'boardingCanAssignFully', kind: 'boolean', icon: BadgeCheck },
    { key: 'boardingUnassignableSections', kind: 'textarea', icon: ShieldAlert },
    { key: 'boardingApprovedCapacity', kind: 'number', icon: Users },
    { key: 'boardingRepresentativeName', kind: 'text', icon: UserRound },
  ],
  tent: [
    { key: 'tentStructureKind', kind: 'select', icon: Tent, optionsKey: 'tentStructureKind' },
    { key: 'tentInstalledCount', kind: 'number', icon: Tent },
    { key: 'tentIntactCount', kind: 'number', icon: BadgeCheck },
    { key: 'tentApprovedCapacityEach', kind: 'number', icon: Users },
    { key: 'tentAreaEach', kind: 'number', icon: LayoutGrid },
    { key: 'tentFlooringKind', kind: 'select', icon: Warehouse, optionsKey: 'tentFlooringKind' },
    { key: 'tentDrainageStatus', kind: 'select', icon: Droplets, optionsKey: 'tentDrainageStatus' },
    { key: 'tentWindResistanceStatus', kind: 'select', icon: Wind, optionsKey: 'tentWindResistanceStatus' },
    { key: 'tentHvacStatus', kind: 'text', icon: Snowflake },
    { key: 'tentWaterSource', kind: 'select', icon: Droplets, optionsKey: 'tentWaterSource' },
    { key: 'tentWaterHealthStatus', kind: 'text', icon: HeartPulse },
    { key: 'tentToiletCount', kind: 'number', icon: Bath },
    { key: 'tentWasteLocation', kind: 'text', icon: Warehouse },
    { key: 'tentPublicLighting', kind: 'select', icon: Lamp, optionsKey: 'tentPublicLighting' },
    { key: 'tentExitPathLighting', kind: 'select', icon: Lamp, optionsKey: 'tentExitPathLighting' },
    { key: 'tentEmergencyVehicleAccess', kind: 'boolean', icon: Car },
    { key: 'tentSafeAssemblyPoint', kind: 'text', icon: Users },
    { key: 'tentFireEquipment', kind: 'text', icon: Flame },
    { key: 'tentMaintenanceManager', kind: 'text', icon: UserRound },
    { key: 'tentFinalApprovedCapacity', kind: 'number', icon: Users },
  ],
  lodging: [
    { key: 'lodgingCenterKind', kind: 'select', icon: Home, optionsKey: 'lodgingCenterKind' },
    { key: 'lodgingBuildingCount', kind: 'number', icon: Building2 },
    { key: 'lodgingFloorCount', kind: 'number', icon: Building2 },
    { key: 'lodgingRoomCount', kind: 'number', icon: DoorOpen },
    { key: 'lodgingFixedBedCount', kind: 'number', icon: BedDouble },
    { key: 'lodgingUsableBedCount', kind: 'number', icon: BedDouble },
    { key: 'lodgingSingleRoomCount', kind: 'number', icon: BedDouble },
    { key: 'lodgingMultiRoomCount', kind: 'number', icon: BedDouble },
    { key: 'lodgingRoomCapacities', kind: 'roomTable', icon: LayoutGrid },
    { key: 'lodgingAssignableRoomCount', kind: 'number', icon: DoorOpen },
    { key: 'lodgingOutOfServiceRoomCount', kind: 'number', icon: ShieldAlert },
    { key: 'lodgingPrivateBathroomCount', kind: 'number', icon: Bath },
    { key: 'lodgingSharedBathroomCount', kind: 'number', icon: Droplets },
    { key: 'lodgingBathCount', kind: 'number', icon: Bath },
    { key: 'lodgingLinenStatus', kind: 'select', icon: Shirt, optionsKey: 'lodgingLinenStatus' },
    { key: 'lodgingCanWashLinen', kind: 'boolean', icon: Shirt },
    { key: 'lodgingHvacStatus', kind: 'text', icon: Snowflake },
    { key: 'lodgingElevatorCount', kind: 'number', icon: ArrowUpDown },
    { key: 'lodgingElevatorStatus', kind: 'text', icon: ArrowUpDown },
    { key: 'lodgingStepFreeAccess', kind: 'boolean', icon: ArrowUpDown },
    { key: 'lodgingLuggageStorage', kind: 'text', icon: Warehouse },
    { key: 'lodgingCleaningService', kind: 'select', icon: Shirt, optionsKey: 'lodgingCleaningService' },
    { key: 'lodgingNightReception', kind: 'boolean', icon: Clock },
    { key: 'lodgingLockStatus', kind: 'text', icon: DoorOpen },
    { key: 'lodgingOperationTerms', kind: 'textarea', icon: BadgeCheck },
    { key: 'lodgingRoomEquipment', kind: 'textarea', icon: Warehouse },
    { key: 'lodgingFinalApprovedCapacity', kind: 'number', icon: Users },
  ],
  'assembly-hall': [
    { key: 'assemblyCenterKind', kind: 'select', icon: Landmark, optionsKey: 'assemblyCenterKind' },
    { key: 'assemblyMainHallArea', kind: 'number', icon: LayoutGrid },
    { key: 'assemblySideHallCount', kind: 'number', icon: Building2 },
    { key: 'assemblyFixedSeatCount', kind: 'number', icon: Users },
    { key: 'assemblySeatsRemovable', kind: 'boolean', icon: Users },
    { key: 'assemblyUsableAreaAfterRemoval', kind: 'number', icon: LayoutGrid },
    { key: 'assemblySideRoomCount', kind: 'number', icon: DoorOpen },
    { key: 'assemblyHasStage', kind: 'boolean', icon: Mic2 },
    { key: 'assemblyHasBackstage', kind: 'boolean', icon: Warehouse },
    { key: 'assemblyToiletCount', kind: 'number', icon: Bath },
    { key: 'assemblyAvSystem', kind: 'text', icon: Volume2 },
    { key: 'assemblyVentilationStatus', kind: 'select', icon: Wind, optionsKey: 'assemblyVentilationStatus' },
    { key: 'assemblyAvStorage', kind: 'text', icon: Warehouse },
    { key: 'assemblyEventSchedule', kind: 'textarea', icon: Clock },
    { key: 'assemblyCanSplitSpace', kind: 'boolean', icon: LayoutGrid },
    { key: 'assemblyFinalApprovedCapacity', kind: 'number', icon: Users },
    { key: 'assemblyOperatorRestrictions', kind: 'textarea', icon: ShieldAlert },
  ],
  'sports-hall': [
    { key: 'sportsComplexKind', kind: 'select', icon: Building2, optionsKey: 'sportsComplexKind' },
    { key: 'sportsOperatorName', kind: 'text', icon: UserRound },
    { key: 'sportsMainFloorArea', kind: 'number', icon: LayoutGrid },
    { key: 'sportsIndependentHallCount', kind: 'number', icon: Building2 },
    { key: 'sportsSpectatorSeatCount', kind: 'number', icon: Users },
    { key: 'sportsSpectatorStayUse', kind: 'select', icon: BedDouble, optionsKey: 'sportsSpectatorStayUse' },
    { key: 'sportsShowerCount', kind: 'number', icon: Bath },
    { key: 'sportsToiletCount', kind: 'number', icon: Droplets },
    { key: 'sportsEntryExitCount', kind: 'number', icon: DoorOpen },
    { key: 'sportsEmergencyExitStatus', kind: 'select', icon: DoorOpen, optionsKey: 'sportsEmergencyExitStatus' },
    { key: 'sportsFlooringCondition', kind: 'select', icon: Warehouse, optionsKey: 'sportsFlooringCondition' },
    { key: 'sportsFloorCovering', kind: 'text', icon: Warehouse },
    { key: 'sportsHasEquipmentStorage', kind: 'boolean', icon: Warehouse },
    { key: 'sportsVentilation', kind: 'text', icon: Wind },
    { key: 'sportsHvacStatus', kind: 'text', icon: Snowflake },
    { key: 'sportsEmergencyLighting', kind: 'select', icon: Lamp, optionsKey: 'sportsEmergencyLighting' },
    { key: 'sportsFireStatus', kind: 'text', icon: Flame },
    { key: 'sportsProposedCapacity', kind: 'number', icon: Users },
    { key: 'sportsFinalApprovedCapacity', kind: 'number', icon: Users },
    { key: 'sportsHasReceptionDesk', kind: 'boolean', icon: BadgeCheck },
  ],
  husseinieh: [
    { key: 'husseiniehManagerName', kind: 'text', icon: UserRound },
    { key: 'husseiniehMainHallArea', kind: 'number', icon: LayoutGrid },
    { key: 'husseiniehSideHallCount', kind: 'number', icon: Building2 },
    { key: 'husseiniehSideHallAreas', kind: 'textarea', icon: LayoutGrid },
    { key: 'husseiniehFloorCount', kind: 'number', icon: Building2 },
    { key: 'husseiniehBalconyCount', kind: 'number', icon: Building2 },
    { key: 'husseiniehBalconyStayUse', kind: 'select', icon: BedDouble, optionsKey: 'husseiniehBalconyStayUse' },
    { key: 'husseiniehMainHallCapacity', kind: 'number', icon: Users },
    { key: 'husseiniehSideRoomCount', kind: 'number', icon: DoorOpen },
    { key: 'husseiniehHasStaffRoom', kind: 'boolean', icon: UserRound },
    { key: 'husseiniehHasStorage', kind: 'boolean', icon: Warehouse },
    { key: 'husseiniehHasKitchen', kind: 'boolean', icon: UtensilsCrossed },
    { key: 'husseiniehKitchenStatus', kind: 'select', icon: UtensilsCrossed, optionsKey: 'husseiniehKitchenStatus' },
    { key: 'husseiniehAudioStatus', kind: 'select', icon: Volume2, optionsKey: 'husseiniehAudioStatus' },
    { key: 'husseiniehCeremonyHours', kind: 'timeTable', icon: Clock },
    { key: 'husseiniehGenderSeparation', kind: 'textarea', icon: Users },
    { key: 'husseiniehToiletStatus', kind: 'text', icon: Bath },
    { key: 'husseiniehVentilationStatus', kind: 'select', icon: Wind, optionsKey: 'husseiniehVentilationStatus' },
    { key: 'husseiniehCanBringSupplies', kind: 'boolean', icon: Car },
    { key: 'husseiniehTrusteeRestrictions', kind: 'textarea', icon: ShieldAlert },
  ],
  mosque: [
    { key: 'mosqueTrusteeName', kind: 'text', icon: UserRound },
    { key: 'mosqueHallCount', kind: 'number', icon: Landmark },
    { key: 'mosqueFloorCount', kind: 'number', icon: Building2 },
    { key: 'mosqueAssignableArea', kind: 'number', icon: LayoutGrid },
    { key: 'mosqueHallApprovedCapacity', kind: 'number', icon: Users },
    { key: 'mosqueHasSistersSpace', kind: 'boolean', icon: Users },
    { key: 'mosqueHasBrothersSpace', kind: 'boolean', icon: Users },
    { key: 'mosqueBanHours', kind: 'timeTable', icon: Clock },
    { key: 'mosqueReligiousSchedule', kind: 'textarea', icon: Clock },
    { key: 'mosqueToiletCount', kind: 'number', icon: Bath },
    { key: 'mosqueAblutionCount', kind: 'number', icon: Droplets },
    { key: 'mosqueHotWaterStatus', kind: 'select', icon: Droplets, optionsKey: 'mosqueHotWaterStatus' },
    { key: 'mosqueHasShoeStorage', kind: 'boolean', icon: Warehouse },
    { key: 'mosqueHasStorage', kind: 'boolean', icon: Warehouse },
    { key: 'mosqueKitchenRestriction', kind: 'textarea', icon: UtensilsCrossed },
    { key: 'mosqueSpeakerRestriction', kind: 'textarea', icon: Volume2 },
    { key: 'mosqueTrusteeRules', kind: 'textarea', icon: ShieldAlert },
    { key: 'mosqueManagerLocationKind', kind: 'select', icon: Home, optionsKey: 'mosqueManagerLocationKind' },
    { key: 'mosqueManagerLocationText', kind: 'text', icon: Home },
  ],
  school: [
    { key: 'schoolKind', kind: 'select', icon: School, optionsKey: 'schoolKind' },
    { key: 'schoolFloorCount', kind: 'number', icon: Building2 },
    { key: 'schoolBuildingCount', kind: 'number', icon: Building2 },
    { key: 'schoolTotalClassroomCount', kind: 'number', icon: LayoutGrid },
    { key: 'schoolUsableClassroomCount', kind: 'number', icon: LayoutGrid },
    { key: 'schoolUsableHallCount', kind: 'number', icon: Landmark },
    { key: 'schoolPrayerRoomCount', kind: 'number', icon: Landmark },
    { key: 'schoolAssignableOfficeCount', kind: 'number', icon: DoorOpen },
    { key: 'schoolClassroomApprovedCapacity', kind: 'number', icon: Users },
    { key: 'schoolAllowedStayFloors', kind: 'number', icon: Building2 },
    { key: 'schoolToiletCount', kind: 'number', icon: Bath },
    { key: 'schoolWashStatus', kind: 'select', icon: Droplets, optionsKey: 'schoolWashStatus' },
    { key: 'schoolHvacStatus', kind: 'select', icon: Snowflake, optionsKey: 'schoolHvacStatus' },
    { key: 'schoolManagerUserId', kind: 'user', icon: UserRound },
    { key: 'schoolManagerName', kind: 'text', icon: UserRound },
    { key: 'schoolEquipmentHandoverImageId', kind: 'file', icon: FileCheck2 },
    { key: 'schoolFinalHandoverImageId', kind: 'file', icon: FileCheck2 },
  ],
}

const optionI18n: Record<keyof typeof typeDetailSelectOptions, string> = {
  medicalActivityStatus: 'medicalActivityStatuses',
  boardingCenterKind: 'boardingCenterKinds',
  tentStructureKind: 'tentStructureKinds',
  tentFlooringKind: 'tentFlooringKinds',
  tentDrainageStatus: 'drainageStatuses',
  tentWindResistanceStatus: 'windResistanceStatuses',
  tentWaterSource: 'waterSourceKinds',
  tentPublicLighting: 'lightingStatuses',
  tentExitPathLighting: 'lightingStatuses',
  lodgingCenterKind: 'lodgingCenterKinds',
  lodgingLinenStatus: 'linenSupplyStatuses',
  lodgingCleaningService: 'cleaningServiceKinds',
  assemblyCenterKind: 'assemblyCenterKinds',
  assemblyVentilationStatus: 'conditionStatuses',
  sportsComplexKind: 'sportsComplexKinds',
  sportsSpectatorStayUse: 'approvalTriStates',
  sportsEmergencyExitStatus: 'emergencyExitStatuses',
  sportsFlooringCondition: 'flooringConditions',
  sportsEmergencyLighting: 'unknownSuitabilityStatuses',
  husseiniehBalconyStayUse: 'approvalTriStates',
  husseiniehKitchenStatus: 'kitchenStatuses',
  husseiniehAudioStatus: 'conditionStatuses',
  husseiniehVentilationStatus: 'conditionStatuses',
  mosqueHotWaterStatus: 'unknownSuitabilityStatuses',
  mosqueManagerLocationKind: 'mosqueManagerLocationKinds',
  schoolKind: 'schoolKinds',
  schoolWashStatus: 'conditionStatuses',
  schoolHvacStatus: 'conditionStatuses',
}

function optionLabel(
  t: (key: string) => string,
  optionsKey: keyof typeof typeDetailSelectOptions,
  value: string,
) {
  return t(`accommodations.${optionI18n[optionsKey]}.${value}`)
}

function kindIcon(kind: AccommodationTypeDetailKind): LucideIcon {
  if (kind === 'tent') return Tent
  if (kind === 'medical') return HeartPulse
  if (kind === 'mosque' || kind === 'husseinieh' || kind === 'assembly-hall') return Landmark
  if (kind === 'school') return School
  if (kind === 'lodging') return Home
  return Building2
}

export function AccommodationTypeDetailsFields({
  kind,
  values,
  onChange,
  uploadPath = '/images',
  idPrefix = 'type-detail',
}: {
  kind: AccommodationTypeDetailKind
  values: TypeDetailFormValues
  onChange: <K extends keyof TypeDetailFormValues>(key: K, value: TypeDetailFormValues[K]) => void
  uploadPath?: string
  idPrefix?: string
}) {
  const { t } = useTranslation()
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const fields = fieldSpecs[kind]
  const users = useQuery({
    queryKey: ['users', 'lookup', 'type-details'],
    enabled: kind === 'school',
    queryFn: async () => {
      const { data } = await api.get<ManagedUser[]>('/users')
      return data
    },
  })

  async function uploadFile(key: keyof TypeDetailFormValues, file: File) {
    setUploadingKey(String(key))
    try {
      const optimized = await optimizeImageFile(file)
      const body = new FormData()
      body.append('file', optimized)
      const { data } = await api.post<{ id: string }>(uploadPath, body)
      onChange(key, data.id)
    } catch (error) {
      toast.error(getApiErrorMessage(error, t('common.error')))
    } finally {
      setUploadingKey(null)
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const id = `${idPrefix}-${field.key}`
        const label = t(`accommodations.${field.key}`)
        if (field.kind === 'boolean') {
          return (
            <div
              key={field.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-cream-50 px-3 py-2.5 sm:col-span-2"
            >
              <span className="flex items-center gap-2 text-sm text-ink-800">
                <field.icon className="size-4 text-teal-600" aria-hidden />
                {label}
              </span>
              <ToggleField
                checked={Boolean(values[field.key])}
                onChange={(on) => onChange(field.key, on)}
                onLabel={t('common.yes')}
                offLabel={t('common.no')}
              />
            </div>
          )
        }
        if (field.kind === 'file') {
          const imageId = String(values[field.key] ?? '')
          return (
            <div key={field.key} className="sm:col-span-2">
              <FormField icon={field.icon} label={label} htmlFor={id}>
                <FileDropField
                  id={id}
                  accept="image/*"
                  capture="environment"
                  previewUrl={imageId ? getImageUrl(imageId) : undefined}
                  uploading={uploadingKey === field.key}
                  onFile={(file) => void uploadFile(field.key, file)}
                  onClear={() => onChange(field.key, '')}
                />
              </FormField>
            </div>
          )
        }
        if (field.kind === 'user') {
          return (
            <FormField key={field.key} icon={field.icon} label={label} htmlFor={id}>
              <SearchSelect
                id={id}
                value={String(values[field.key] ?? '')}
                placeholder={t('accommodations.selectSchoolManager')}
                onChange={(next) => onChange(field.key, next)}
                options={[
                  { value: '', label: t('accommodations.typeDetailUnset') },
                  ...(users.data ?? []).map((user) => ({
                    value: user.id,
                    label: user.fullName || user.username,
                  })),
                ]}
              />
            </FormField>
          )
        }
        if (field.kind === 'select' && field.optionsKey) {
          const optionsKey = field.optionsKey
          return (
            <FormField key={field.key} icon={field.icon} label={label} htmlFor={id}>
              <SearchSelect
                id={id}
                value={String(values[field.key] ?? '')}
                placeholder={label}
                onChange={(next) => onChange(field.key, next)}
                options={[
                  { value: '', label: t('accommodations.typeDetailUnset') },
                  ...typeDetailSelectOptions[optionsKey].map((option) => ({
                    value: option,
                    label: optionLabel(t, optionsKey, option),
                  })),
                ]}
              />
            </FormField>
          )
        }
        if (field.kind === 'roomTable') {
          const rows = values.lodgingRoomCapacities
          return (
            <div key={field.key} className="sm:col-span-2">
              <FormField icon={field.icon} label={label}>
                <RoomCapacityTable
                  rows={rows}
                  onChange={(next) => onChange('lodgingRoomCapacities', next)}
                />
              </FormField>
            </div>
          )
        }
        if (field.kind === 'timeTable') {
          const rows =
            field.key === 'mosqueBanHours' ? values.mosqueBanHours : values.husseiniehCeremonyHours
          return (
            <div key={field.key} className="sm:col-span-2">
              <FormField icon={field.icon} label={label}>
                <TimeRangeTable
                  rows={rows}
                  onChange={(next) => {
                    if (field.key === 'mosqueBanHours') onChange('mosqueBanHours', next)
                    else onChange('husseiniehCeremonyHours', next)
                  }}
                />
              </FormField>
            </div>
          )
        }
        if (field.kind === 'textarea') {
          return (
            <div key={field.key} className="sm:col-span-2">
              <FormField icon={field.icon} label={label} htmlFor={id}>
                <textarea
                  id={id}
                  className={fieldClassName}
                  rows={3}
                  value={String(values[field.key] ?? '')}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              </FormField>
            </div>
          )
        }
        return (
          <FormField key={field.key} icon={field.icon} label={label} htmlFor={id}>
            <input
              id={id}
              type={field.kind === 'number' ? 'number' : 'text'}
              min={field.kind === 'number' ? 0 : undefined}
              className={fieldClassName}
              value={String(values[field.key] ?? '')}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </FormField>
        )
      })}
    </div>
  )
}

function RoomCapacityTable({
  rows,
  onChange,
}: {
  rows: RoomCapacityFormRow[]
  onChange: (rows: RoomCapacityFormRow[]) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-cream-50 p-3">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
          <input
            className={fieldClassName}
            value={row.label}
            placeholder={t('accommodations.tableRoomLabel')}
            onChange={(e) => {
              const next = [...rows]
              next[index] = { ...row, label: e.target.value }
              onChange(next)
            }}
          />
          <input
            type="number"
            min={0}
            className={fieldClassName}
            value={row.capacity}
            placeholder={t('accommodations.tableCapacity')}
            onChange={(e) => {
              const next = [...rows]
              next[index] = { ...row, capacity: e.target.value }
              onChange(next)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            icon
            onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))}
            aria-label={t('accommodations.typeDetailRemoveRow')}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ))}
      <Button type="button" variant="soft" onClick={() => onChange([...rows, emptyRoomCapacityRow()])}>
        <Plus className="size-4" aria-hidden />
        {t('accommodations.typeDetailAddRow')}
      </Button>
    </div>
  )
}

function TimeRangeTable({
  rows,
  onChange,
}: {
  rows: TimeRangeFormRow[]
  onChange: (rows: TimeRangeFormRow[]) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-cream-50 p-3">
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem_auto]">
          <input
            className={fieldClassName}
            value={row.title}
            placeholder={t('accommodations.tableTimeTitle')}
            onChange={(e) => {
              const next = [...rows]
              next[index] = { ...row, title: e.target.value }
              onChange(next)
            }}
          />
          <input
            className={`${fieldClassName} digit-field`}
            value={row.startTime}
            placeholder={t('accommodations.tableTimeFrom')}
            onChange={(e) => {
              const next = [...rows]
              next[index] = { ...row, startTime: e.target.value }
              onChange(next)
            }}
          />
          <input
            className={`${fieldClassName} digit-field`}
            value={row.endTime}
            placeholder={t('accommodations.tableTimeTo')}
            onChange={(e) => {
              const next = [...rows]
              next[index] = { ...row, endTime: e.target.value }
              onChange(next)
            }}
          />
          <Button
            type="button"
            variant="ghost"
            icon
            onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))}
            aria-label={t('accommodations.typeDetailRemoveRow')}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ))}
      <Button type="button" variant="soft" onClick={() => onChange([...rows, emptyTimeRangeRow()])}>
        <Plus className="size-4" aria-hidden />
        {t('accommodations.typeDetailAddRow')}
      </Button>
    </div>
  )
}

export function AccommodationTypeDetailsPanel({
  kind,
  item,
}: {
  kind: AccommodationTypeDetailKind
  item: AccommodationTypeDetails & Partial<Pick<Accommodation, 'schoolManagerUser'>>
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.split('-')[0] ?? 'fa'
  const empty = '—'
  const tones = ['teal', 'mint', 'ink'] as const
  const fields = fieldSpecs[kind]
  const n = (value: number) => formatNumber(value, locale)

  function displayValue(field: FieldSpec) {
    const value = item[field.key as keyof AccommodationTypeDetails]
    if (field.kind === 'boolean') {
      if (value == null) return empty
      return value ? t('common.yes') : t('common.no')
    }
    if (field.kind === 'number') {
      if (value == null) return empty
      return n(Number(value))
    }
    if (field.kind === 'select' && field.optionsKey && value) {
      return optionLabel(t, field.optionsKey, String(value))
    }
    if (field.kind === 'file') {
      const imageId = typeof value === 'string' ? value : ''
      if (!imageId) return empty
      return (
        <a href={getImageUrl(imageId)} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
          {t('common.view')}
        </a>
      )
    }
    if (field.kind === 'user') {
      return item.schoolManagerUser?.fullName || (value ? String(value) : empty)
    }
    if (field.kind === 'roomTable') {
      const rows = Array.isArray(value) ? value : []
      if (!rows.length) return empty
      return (
        <ul className="space-y-1 text-sm">
          {rows.map((row, index) => (
            <li key={index}>
              {(row as RoomCapacityFormRow).label || t('accommodations.tableRoomLabel')}
              {': '}
              {(row as { capacity?: number | null }).capacity == null
                ? empty
                : n(Number((row as { capacity?: number | null }).capacity))}
            </li>
          ))}
        </ul>
      )
    }
    if (field.kind === 'timeTable') {
      const rows = Array.isArray(value) ? value : []
      if (!rows.length) return empty
      return (
        <ul className="space-y-1 text-sm">
          {rows.map((row, index) => {
            const itemRow = row as TimeRangeFormRow
            const range = [itemRow.startTime, itemRow.endTime].filter(Boolean).join(' – ')
            return (
              <li key={index} dir="ltr" className="text-start">
                {itemRow.title ? `${itemRow.title}: ` : ''}
                {range || empty}
              </li>
            )
          })}
        </ul>
      )
    }
    return value ? String(value) : empty
  }

  return (
    <>
      <FormSectionTitle icon={kindIcon(kind)}>
        {t('accommodations.sectionTypeDetails')}
      </FormSectionTitle>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        {fields.map((field, index) => {
          const value = item[field.key as keyof AccommodationTypeDetails]
          const isEmpty =
            field.kind === 'boolean'
              ? value == null
              : field.kind === 'file' || field.kind === 'user'
                ? !value && !(field.kind === 'user' && item.schoolManagerUser)
                : Array.isArray(value)
                  ? value.length === 0
                  : value == null || value === ''
          return (
            <FormFactTile
              key={field.key}
              icon={field.icon}
              label={t(`accommodations.${field.key}`)}
              value={displayValue(field)}
              empty={isEmpty}
              tone={tones[index % tones.length]}
              className={
                field.kind === 'textarea' ||
                field.kind === 'file' ||
                field.kind === 'roomTable' ||
                field.kind === 'timeTable'
                  ? 'sm:col-span-2'
                  : undefined
              }
            />
          )
        })}
      </div>
    </>
  )
}
