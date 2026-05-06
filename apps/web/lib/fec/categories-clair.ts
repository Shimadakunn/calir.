import { isPlanComptableCode } from "./plan-comptable-2026"

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
      "612",
      "613",
      "614",
      "615",
      "616",
      "618",
      "626",
      "628",
      "65",
      "67",
    ],
  },
  {
    key: "rh",
    label: "Ressources humaines",
    prefixes: ["621", "64"],
  },
  {
    key: "variables",
    label: "Coûts variables",
    prefixes: ["60", "611", "624"],
  },
  {
    key: "exercices",
    label: "Charges sur exercices antérieurs",
    prefixes: ["672"],
  },
  {
    key: "acquisitions",
    label: "Acquisitions croissance",
    prefixes: ["617", "622", "623", "625"],
  },
  {
    key: "comptables",
    label: "Charges comptables",
    prefixes: ["6226", "68"],
  },
  {
    key: "financieres",
    label: "Charges financières",
    prefixes: ["627", "66"],
  },
  {
    key: "gouvernementales",
    label: "Charges gouvernementales",
    prefixes: ["63", "69"],
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
    prefixes: ["707", "701", "702", "703"],
  },
  {
    key: "services",
    label: "Services",
    prefixes: ["706", "704", "705", "708"],
  },
  {
    key: "transports",
    label: "Transports",
    prefixes: ["7085"],
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
    prefixes: ["71", "72", "74", "75", "77", "78"],
  },
]

export function getUnknownClairCategoryPrefixes(): string[] {
  const prefixes = new Set<string>()
  for (const category of EXPENSE_CATEGORIES)
    for (const prefix of category.prefixes) prefixes.add(prefix)
  for (const category of REVENUE_CATEGORIES)
    for (const prefix of category.prefixes) prefixes.add(prefix)

  return Array.from(prefixes)
    .filter((prefix) => !isPlanComptableCode(prefix))
    .sort()
}
