// Mapping des classes du Plan Comptable General (PCG) francais.
// Reference : https://www.plancomptable.com/
//
// Les categories agreges sont orientees "decision SMB" plutot que strictement
// PCG : un dirigeant pense "couts fixes vs variables", pas "compte 613 vs 624".
// Les regles longues prefixes l'emportent (ex : 6226 honoraires expert
// comptable bat 622 intermediaires generaux).

export type AccountClass = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface ExpenseCategory {
  key: string
  label: string
  prefixes: readonly string[]
}

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  {
    key: "fixes",
    label: "Coûts fixes",
    prefixes: [
      "612", // credit-bail
      "613", // locations
      "614", // charges locatives
      "615", // entretien et reparations
      "616", // assurances
      "618", // documentation, divers
      "626", // postal, telecom
      "628", // divers
      "65", // autres charges de gestion courante
      "67", // charges exceptionnelles (672 ressort plus bas via prefixe long)
    ],
  },
  {
    key: "rh",
    label: "Ressources humaines",
    prefixes: [
      "621", // personnel exterieur a l'entreprise
      "64", // charges de personnel
    ],
  },
  {
    key: "variables",
    label: "Coûts variables",
    prefixes: [
      "60", // achats (matieres, marchandises, fournitures)
      "611", // sous-traitance generale
      "624", // transports
    ],
  },
  {
    key: "exercices",
    label: "Charges sur exercices antérieurs",
    prefixes: ["672"],
  },
  {
    key: "acquisitions",
    label: "Acquisitions croissance",
    prefixes: [
      "617", // etudes et recherches
      "622", // remunerations d'intermediaires (6226 part en "comptables")
      "623", // publicite, publications, relations publiques
      "625", // deplacements, missions, receptions
    ],
  },
  {
    key: "comptables",
    label: "Charges comptables",
    prefixes: [
      "6226", // honoraires expert comptable (specifique, bat 622)
      "68", // dotations aux amortissements et provisions
    ],
  },
  {
    key: "financieres",
    label: "Charges financières",
    prefixes: [
      "627", // services bancaires et assimiles
      "66", // charges financieres
    ],
  },
  {
    key: "gouvernementales",
    label: "Charges gouvernementales",
    prefixes: [
      "63", // impots, taxes et versements assimiles
      "69", // impots sur les benefices
    ],
  },
]

export interface RevenueCategory {
  key: string
  label: string
  prefixes: readonly string[]
}

export const REVENUE_CATEGORIES: readonly RevenueCategory[] = [
  {
    key: "marchandises",
    label: "Marchandises",
    prefixes: [
      "707", // ventes de marchandises
      "701", // ventes de produits finis
      "702", // ventes de produits intermediaires
      "703", // ventes de produits residuels
    ],
  },
  {
    key: "services",
    label: "Services",
    prefixes: [
      "706", // prestations de services
      "704", // travaux
      "705", // etudes
      "708", // produits des activites annexes (7085 part en "transports")
    ],
  },
  {
    key: "transports",
    label: "Transports",
    prefixes: ["7085"], // ports et frais accessoires factures
  },
  {
    key: "financiers",
    label: "Produits financiers",
    prefixes: ["76"],
  },
  {
    key: "exercices",
    label: "Produits sur exercices antérieurs",
    prefixes: ["772"],
  },
  {
    key: "divers",
    label: "Produits divers",
    prefixes: [
      "71", // production stockee
      "72", // production immobilisee
      "74", // subventions d'exploitation
      "75", // autres produits de gestion courante
      "77", // produits exceptionnels (772 ressort plus haut)
      "78", // reprises sur amortissements
      "79", // transferts de charges
    ],
  },
]

// Lookup tables pre-triees : prefixe le plus long en premier (specificite gagne).
const EXPENSE_LOOKUP = buildLookup(EXPENSE_CATEGORIES)
const REVENUE_LOOKUP = buildLookup(REVENUE_CATEGORIES)

function buildLookup<T extends { prefixes: readonly string[] }>(
  categories: readonly T[]
): ReadonlyArray<{ prefix: string; category: T }> {
  const list: Array<{ prefix: string; category: T }> = []
  for (const cat of categories)
    for (const prefix of cat.prefixes) list.push({ prefix, category: cat })
  list.sort((a, b) => b.prefix.length - a.prefix.length)
  return list
}

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
  for (const rule of EXPENSE_LOOKUP)
    if (t.startsWith(rule.prefix)) return rule.category
  return null
}

export function getRevenueCategory(compteNum: string): RevenueCategory | null {
  const t = compteNum.trim()
  for (const rule of REVENUE_LOOKUP)
    if (t.startsWith(rule.prefix)) return rule.category
  return null
}
