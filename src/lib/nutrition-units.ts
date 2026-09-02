export const ingredientUnits = [
  'GRAM',
  'KILOGRAM',
  'MILLILITER',
  'LITER',
  'PIECE',
] as const

export type IngredientUnit = (typeof ingredientUnits)[number]

type UnitDimension = 'mass' | 'volume' | 'count'

const UNIT_META: Record<IngredientUnit, { dim: UnitDimension; toBase: number }> = {
  GRAM: { dim: 'mass', toBase: 1 },
  KILOGRAM: { dim: 'mass', toBase: 1000 },
  MILLILITER: { dim: 'volume', toBase: 1 },
  LITER: { dim: 'volume', toBase: 1000 },
  PIECE: { dim: 'count', toBase: 1 },
}

export function unitDimension(unit: IngredientUnit): UnitDimension {
  return UNIT_META[unit].dim
}

export function unitsAreCompatible(a: IngredientUnit, b: IngredientUnit) {
  return unitDimension(a) === unitDimension(b)
}

export function compatibleUnits(unit: IngredientUnit): IngredientUnit[] {
  const dim = unitDimension(unit)
  return ingredientUnits.filter((item) => unitDimension(item) === dim)
}

export function convertQuantity(quantity: number, from: IngredientUnit, to: IngredientUnit) {
  if (!unitsAreCompatible(from, to)) {
    return NaN
  }
  return (quantity * UNIT_META[from].toBase) / UNIT_META[to].toBase
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

export type DisplayIngredientUnit = IngredientUnit | 'TON'

export function displayStockUnit(unit: IngredientUnit): IngredientUnit {
  return unit === 'GRAM' ? 'KILOGRAM' : unit
}

export function displayStockQty(quantity: number, unit: IngredientUnit) {
  if (unit === 'GRAM') {
    return convertQuantity(quantity, 'GRAM', 'KILOGRAM')
  }
  return quantity
}

/** Pick a readable unit: ≥۱۰۰۰ کیلو → تن، <۱ کیلو → گرم، <۱ لیتر → سی‌سی. */
export function autoDisplayQuantity(
  quantity: number,
  unit: IngredientUnit,
): { quantity: number; unit: DisplayIngredientUnit } {
  if (!Number.isFinite(quantity)) {
    return { quantity, unit }
  }
  const dim = unitDimension(unit)
  if (dim === 'mass') {
    const kg = convertQuantity(quantity, unit, 'KILOGRAM')
    if (kg >= 1000) {
      return { quantity: kg / 1000, unit: 'TON' }
    }
    if (kg < 1) {
      return { quantity: kg * 1000, unit: 'GRAM' }
    }
    return { quantity: kg, unit: 'KILOGRAM' }
  }
  if (dim === 'volume') {
    const liters = convertQuantity(quantity, unit, 'LITER')
    if (liters < 1) {
      return { quantity: liters * 1000, unit: 'MILLILITER' }
    }
    return { quantity: liters, unit: 'LITER' }
  }
  return { quantity, unit }
}

export function lineCost(
  quantity: number,
  quantityUnit: IngredientUnit,
  pricePerUnit: number,
  priceUnit: IngredientUnit,
) {
  const qty = convertQuantity(quantity, quantityUnit, priceUnit)
  if (!Number.isFinite(qty)) {
    return 0
  }
  return roundMoney(qty * pricePerUnit)
}
