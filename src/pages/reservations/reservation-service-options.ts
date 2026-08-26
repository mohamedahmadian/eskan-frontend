export const SIM_OPERATOR_CODES = [
  'mci',
  'irancell',
  'rightel',
  'shatel',
] as const

export type SimOperatorCode = (typeof SIM_OPERATOR_CODES)[number]

export const BANK_CODES = [
  'melli',
  'mellat',
  'saderat',
  'tejarat',
  'sepah',
  'keshavarzi',
  'maskan',
  'refah',
  'pasargad',
  'parsian',
  'eghtesadNovin',
  'saman',
  'sina',
  'shahr',
  'dey',
  'ayandeh',
  'sarmayeh',
  'karafarin',
  'gardeshgari',
  'iranZamin',
  'resalat',
  'mehrIran',
  'postBank',
  'middleEast',
  'toseeTaavon',
] as const

export type BankCode = (typeof BANK_CODES)[number]
