import {
  EXPENSE_CATEGORIES,
  REVENUE_CATEGORIES,
  type ExpenseCategory,
  type RevenueCategory,
} from "./categories-clair"
import {
  getPlanComptableClass,
  isPlanComptableAccountUnder,
  isPlanComptableAccountUnderAny,
  resolvePlanComptableEntry,
  type AccountClass,
} from "./plan-comptable-2026"

export type { AccountClass, ExpenseCategory, RevenueCategory }
export { EXPENSE_CATEGORIES, REVENUE_CATEGORIES }

// Facade historique des analytics FEC. Les decisions "officielles" passent par
// le plan 2026; les regroupements lisibles par un dirigeant restent dans
// categories-clair.ts.

const CUSTOMER_ACCOUNT_CODES = ["411", "413", "416", "418"] as const
const SUPPLIER_ACCOUNT_CODES = ["40"] as const
const CASH_ACCOUNT_CODES = ["51", "53"] as const

const EXPENSE_LOOKUP = buildLookup(EXPENSE_CATEGORIES)
const REVENUE_LOOKUP = buildLookup(REVENUE_CATEGORIES)

function buildLookup<T extends { prefixes: readonly string[] }>(
  categories: readonly T[]
): ReadonlyArray<{ prefix: string; category: T }> {
  const list: Array<{ prefix: string; category: T }> = []
  for (const category of categories)
    for (const prefix of category.prefixes) list.push({ prefix, category })
  list.sort((a, b) => b.prefix.length - a.prefix.length)
  return list
}

function officialCodeFor(compteNum: string): string | null {
  return resolvePlanComptableEntry(compteNum)?.code ?? null
}

function matchesCategoryPrefix(
  compteNum: string,
  lookup: ReadonlyArray<{ prefix: string; category: ExpenseCategory }>
): ExpenseCategory | null
function matchesCategoryPrefix(
  compteNum: string,
  lookup: ReadonlyArray<{ prefix: string; category: RevenueCategory }>
): RevenueCategory | null
function matchesCategoryPrefix<T>(
  compteNum: string,
  lookup: ReadonlyArray<{ prefix: string; category: T }>
): T | null {
  const code = officialCodeFor(compteNum)
  if (!code) return null
  for (const rule of lookup)
    if (code.startsWith(rule.prefix)) return rule.category
  return null
}

export function getAccountClass(compteNum: string): AccountClass | null {
  return getPlanComptableClass(compteNum)
}

export function isRevenueAccount(compteNum: string): boolean {
  return getAccountClass(compteNum) === 7
}

export function isExpenseAccount(compteNum: string): boolean {
  return getAccountClass(compteNum) === 6
}

export function isCashAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnderAny(compteNum, CASH_ACCOUNT_CODES)
}

export function isCustomerAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnderAny(compteNum, CUSTOMER_ACCOUNT_CODES)
}

export function isSupplierAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnderAny(compteNum, SUPPLIER_ACCOUNT_CODES)
}

export function isPayrollAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "64")
}

export function isExternalChargeAccount(compteNum: string): boolean {
  return (
    isPlanComptableAccountUnder(compteNum, "61") ||
    isPlanComptableAccountUnder(compteNum, "62")
  )
}

export function isPurchaseAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "60")
}

export function isTaxAccount(compteNum: string): boolean {
  return (
    isPlanComptableAccountUnder(compteNum, "63") ||
    isPlanComptableAccountUnder(compteNum, "69")
  )
}

export function isFinancialChargeAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "66")
}

export function isAmortizationAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "68")
}

export function isVatAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "445")
}

export function isSalaryPayableAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "421")
}

export function isSocialChargePayableAccount(compteNum: string): boolean {
  return isPlanComptableAccountUnder(compteNum, "43")
}

export function getExpenseCategory(compteNum: string): ExpenseCategory | null {
  return matchesCategoryPrefix(compteNum, EXPENSE_LOOKUP)
}

export function getRevenueCategory(compteNum: string): RevenueCategory | null {
  return matchesCategoryPrefix(compteNum, REVENUE_LOOKUP)
}
