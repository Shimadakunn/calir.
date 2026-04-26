// Mapping des classes du Plan Comptable General (PCG) francais.
// Reference : https://www.plancomptable.com/

export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ExpenseCategory {
  prefix: string
  label: string
  // Categories simplifiees pour un dirigeant non-comptable
  group:
    | "achats"
    | "charges-externes"
    | "impots"
    | "personnel"
    | "amortissements"
    | "financier"
    | "exceptionnel"
    | "autres"
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { prefix: "60", label: "Achats", group: "achats" },
  { prefix: "61", label: "Services exterieurs", group: "charges-externes" },
  {
    prefix: "62",
    label: "Autres services exterieurs",
    group: "charges-externes",
  },
  { prefix: "63", label: "Impots et taxes", group: "impots" },
  { prefix: "64", label: "Charges de personnel", group: "personnel" },
  { prefix: "65", label: "Autres charges de gestion", group: "autres" },
  { prefix: "66", label: "Charges financieres", group: "financier" },
  { prefix: "67", label: "Charges exceptionnelles", group: "exceptionnel" },
  { prefix: "68", label: "Dotations amortissements", group: "amortissements" },
  { prefix: "69", label: "Impots sur les benefices", group: "impots" },
]

export interface RevenueCategory {
  prefix: string
  label: string
  group:
    | "ventes"
    | "production"
    | "subventions"
    | "financier"
    | "exceptionnel"
    | "autres"
}

export const REVENUE_CATEGORIES: RevenueCategory[] = [
  { prefix: "70", label: "Ventes", group: "ventes" },
  { prefix: "71", label: "Production stockee", group: "production" },
  { prefix: "72", label: "Production immobilisee", group: "production" },
  { prefix: "74", label: "Subventions d'exploitation", group: "subventions" },
  { prefix: "75", label: "Autres produits de gestion", group: "autres" },
  { prefix: "76", label: "Produits financiers", group: "financier" },
  { prefix: "77", label: "Produits exceptionnels", group: "exceptionnel" },
  { prefix: "78", label: "Reprises sur amortissements", group: "autres" },
  { prefix: "79", label: "Transferts de charges", group: "autres" },
]

export function getAccountClass(compteNum: string): AccountClass | null {
  const first = compteNum.trim()[0]
  if (!first) return null
  const num = Number(first)
  if (num >= 1 && num <= 7) return num as AccountClass
  return null
}

export function isRevenueAccount(compteNum: string): boolean {
  return getAccountClass(compteNum) === 7
}

export function isExpenseAccount(compteNum: string): boolean {
  return getAccountClass(compteNum) === 6
}

export function isCashAccount(compteNum: string): boolean {
  // 51 = Banques, 53 = Caisse, 54 = Regies d'avances
  const trimmed = compteNum.trim()
  return /^5[1345]/.test(trimmed)
}

export function isCustomerAccount(compteNum: string): boolean {
  // 411 = Clients, 416 = Clients douteux
  return /^41[1-6]/.test(compteNum.trim())
}

export function isSupplierAccount(compteNum: string): boolean {
  // 401 = Fournisseurs, 403 = Fournisseurs effets a payer, 408 = Factures non parvenues
  return /^40[1-9]/.test(compteNum.trim())
}

export function isPayrollAccount(compteNum: string): boolean {
  return compteNum.trim().startsWith("64")
}

export function isExternalChargeAccount(compteNum: string): boolean {
  const t = compteNum.trim()
  return t.startsWith("61") || t.startsWith("62")
}

export function isPurchaseAccount(compteNum: string): boolean {
  return compteNum.trim().startsWith("60")
}

export function isTaxAccount(compteNum: string): boolean {
  const t = compteNum.trim()
  return t.startsWith("63") || t.startsWith("69")
}

export function isFinancialChargeAccount(compteNum: string): boolean {
  return compteNum.trim().startsWith("66")
}

export function isAmortizationAccount(compteNum: string): boolean {
  return compteNum.trim().startsWith("68")
}

export function getExpenseCategory(compteNum: string): ExpenseCategory | null {
  const t = compteNum.trim()
  return EXPENSE_CATEGORIES.find((c) => t.startsWith(c.prefix)) ?? null
}

export function getRevenueCategory(compteNum: string): RevenueCategory | null {
  const t = compteNum.trim()
  return REVENUE_CATEGORIES.find((c) => t.startsWith(c.prefix)) ?? null
}
