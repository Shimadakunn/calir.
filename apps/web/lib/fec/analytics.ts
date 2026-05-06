import {
  type ExpenseCategory,
  EXPENSE_CATEGORIES,
  getAccountClass,
  getExpenseCategory,
  getRevenueCategory,
  isAmortizationAccount,
  isCashAccount,
  isCustomerAccount,
  isExpenseAccount,
  isExternalChargeAccount,
  isFinancialChargeAccount,
  isPayrollAccount,
  isPurchaseAccount,
  isRevenueAccount,
  isSupplierAccount,
  isTaxAccount,
  REVENUE_CATEGORIES,
  type RevenueCategory,
} from "./accounts"
import {
  type AgedBalance,
  computeAgedPayables,
  computeAgedReceivables,
} from "./aged-balance"
import { type CashProjection, computeCashProjection } from "./cash-projection"
import { formatEuro } from "./format"
import { resolvePlanComptableEntry } from "./plan-comptable-2026"
import type { FecEntry, FecParseResult } from "./types"

export interface PeriodInfo {
  startDate: Date
  endDate: Date
  fiscalYear: number
  monthsCovered: number
}

export interface KpiSummary {
  // Compte de resultat (P&L)
  revenue: number
  expenses: number
  netResult: number
  margin: number // en %
  // Decoupage des charges
  purchases: number
  externalCharges: number
  payroll: number
  taxes: number
  financialCharges: number
  amortizations: number
  // Treso & BFR
  cashBalance: number
  customerReceivables: number
  supplierPayables: number
  // EBE = CA - achats - charges externes - personnel - impots (hors IS)
  ebe: number
  // Marge brute = CA - achats consommes
  grossMargin: number
  grossMarginRate: number
  // Seuil de rentabilite (point mort)
  // Variables = categorie "variables" du PCG (60, 611, 624)
  // Fixes = total charges - variables
  // MCV = CA - variables ; taux MCV = MCV/CA
  // Seuil = fixes / taux MCV ; marge securite = CA - seuil
  variableCosts: number
  fixedCosts: number
  contributionMargin: number
  contributionMarginRate: number // en %
  breakevenPoint: number // CA minimum pour resultat = 0
  safetyMargin: number // CA - seuil (en €)
  safetyMarginRate: number // en % du CA
}

export interface MonthlyPoint {
  month: string // YYYY-MM
  monthLabel: string
  revenue: number
  expenses: number
  result: number
  cashFlow: number
  cashBalance: number
}

export interface CategoryBreakdown {
  key: string
  label: string
  amount: number
  share: number
  fill?: string
}

export interface TopCounterparty {
  accountNum: string
  label: string
  amount: number
  entryCount: number
  lastDate: Date
}

export type {
  AgedBalance,
  AgedBalanceBucket,
  AgedBalanceCounterparty,
} from "./aged-balance"
export type { CashProjection } from "./cash-projection"

export interface ActionableInsight {
  id: string
  severity: "info" | "warning" | "critical" | "positive"
  title: string
  description: string
  metric?: string
  action: string
  category:
    | "charges"
    | "ventes"
    | "tresorerie"
    | "clients"
    | "fournisseurs"
    | "marge"
}

export interface DashboardData {
  meta: FecParseResult["meta"]
  period: PeriodInfo
  kpi: KpiSummary
  monthly: MonthlyPoint[]
  expenseCategories: CategoryBreakdown[]
  revenueCategories: CategoryBreakdown[]
  topCustomers: TopCounterparty[]
  topSuppliers: TopCounterparty[]
  topExpenseAccounts: TopCounterparty[]
  topRevenueAccounts: TopCounterparty[]
  insights: ActionableInsight[]
  cashByAccount: TopCounterparty[]
  agedReceivables: AgedBalance
  agedPayables: AgedBalance
  cashProjection: CashProjection
  warnings: string[]
}

// Rampes ordonnees du plus fonce au plus clair : la categorie la plus grosse
// (idx 0 apres tri desc par montant) recoit la couleur la plus saturee.
const REVENUE_RAMP = [
  "var(--revenue-5)",
  "var(--revenue-4)",
  "var(--revenue-3)",
  "var(--revenue-2)",
  "var(--revenue-1)",
]

const EXPENSE_RAMP = [
  "var(--expense-5)",
  "var(--expense-4)",
  "var(--expense-3)",
  "var(--expense-2)",
  "var(--expense-1)",
]

function computeOfficialPlanWarnings(entries: FecEntry[]): string[] {
  const unknownAccounts = new Map<string, string>()
  for (const entry of entries) {
    if (resolvePlanComptableEntry(entry.compteNum)) continue
    if (!unknownAccounts.has(entry.compteNum))
      unknownAccounts.set(entry.compteNum, entry.compteLib)
  }

  if (unknownAccounts.size === 0) return []

  const preview = Array.from(unknownAccounts.entries())
    .slice(0, 8)
    .map(([code, label]) => (label ? `${code} (${label})` : code))
  const suffix = unknownAccounts.size > preview.length ? ", ..." : ""

  return [
    `${unknownAccounts.size} compte(s) non rattaché(s) au plan de comptes officiel 2026 : ${preview.join(", ")}${suffix}. Ces comptes sont exclus des catégories métier.`,
  ]
}

// Helpers exposes pour reattribuer les fills apres deserialisation.
// Le `fill` est de la presentation, pas de la donnee : on ne le persiste pas.
export function assignRevenueFills(
  items: CategoryBreakdown[]
): CategoryBreakdown[] {
  return items.map((it, idx) => ({
    ...it,
    fill: REVENUE_RAMP[idx % REVENUE_RAMP.length]!,
  }))
}

export function assignExpenseFills(
  items: CategoryBreakdown[]
): CategoryBreakdown[] {
  return items.map((it, idx) => ({
    ...it,
    fill: EXPENSE_RAMP[idx % EXPENSE_RAMP.length]!,
  }))
}

function monthKey(date: Date): string {
  return `${String(date.getUTCFullYear())}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function monthLabel(date: Date): string {
  const formatter = new Intl.DateTimeFormat("fr-FR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
  return formatter.format(date)
}

function computePeriod(entries: FecEntry[]): PeriodInfo {
  const dates = entries.map((e) => e.ecritureDate.getTime())
  const startDate = new Date(Math.min(...dates))
  const endDate = new Date(Math.max(...dates))
  const months =
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth()) +
    1
  return {
    startDate,
    endDate,
    fiscalYear: endDate.getUTCFullYear(),
    monthsCovered: Math.max(1, months),
  }
}

function sumRevenue(entries: FecEntry[]): number {
  let total = 0
  for (const e of entries) {
    if (isRevenueAccount(e.compteNum)) {
      total += e.credit - e.debit
    }
  }
  return total
}

function sumExpenses(entries: FecEntry[]): number {
  let total = 0
  for (const e of entries) {
    if (isExpenseAccount(e.compteNum)) {
      total += e.debit - e.credit
    }
  }
  return total
}

function sumByPredicate(
  entries: FecEntry[],
  predicate: (e: FecEntry) => boolean
): number {
  let total = 0
  for (const e of entries) {
    if (predicate(e)) {
      total += e.debit - e.credit
    }
  }
  return total
}

function computeKpi(entries: FecEntry[]): KpiSummary {
  const revenue = sumRevenue(entries)
  const expenses = sumExpenses(entries)
  const netResult = revenue - expenses
  const margin = revenue > 0 ? (netResult / revenue) * 100 : 0

  const purchases = sumByPredicate(entries, (e) =>
    isPurchaseAccount(e.compteNum)
  )
  const externalCharges = sumByPredicate(entries, (e) =>
    isExternalChargeAccount(e.compteNum)
  )
  const payroll = sumByPredicate(entries, (e) => isPayrollAccount(e.compteNum))
  const taxes = sumByPredicate(entries, (e) => isTaxAccount(e.compteNum))
  const financialCharges = sumByPredicate(entries, (e) =>
    isFinancialChargeAccount(e.compteNum)
  )
  const amortizations = sumByPredicate(entries, (e) =>
    isAmortizationAccount(e.compteNum)
  )

  let cashBalance = 0
  let customerReceivables = 0
  let supplierPayables = 0
  for (const e of entries) {
    if (isCashAccount(e.compteNum)) {
      cashBalance += e.debit - e.credit
    }
    if (isCustomerAccount(e.compteNum)) {
      customerReceivables += e.debit - e.credit
    }
    if (isSupplierAccount(e.compteNum)) {
      supplierPayables += e.credit - e.debit
    }
  }

  const grossMargin = revenue - purchases
  const grossMarginRate = revenue > 0 ? (grossMargin / revenue) * 100 : 0
  const ebe = revenue - purchases - externalCharges - payroll - taxes

  // Seuil de rentabilite : on s'appuie sur la categorisation "variables" du PCG
  // (60 achats, 611 sous-traitance, 624 transports). Le reste des charges 6x est
  // considere comme fixe — approximation classique en absence de compta analytique.
  const variableCosts = sumByPredicate(entries, (e) => {
    const cat = getExpenseCategory(e.compteNum)
    return cat?.key === "variables"
  })
  const fixedCosts = expenses - variableCosts
  const contributionMargin = revenue - variableCosts
  const contributionMarginRate =
    revenue > 0 ? (contributionMargin / revenue) * 100 : 0
  const breakevenPoint =
    contributionMarginRate > 0 ? fixedCosts / (contributionMarginRate / 100) : 0
  const safetyMargin = breakevenPoint > 0 ? revenue - breakevenPoint : 0
  const safetyMarginRate = revenue > 0 ? (safetyMargin / revenue) * 100 : 0

  return {
    revenue,
    expenses,
    netResult,
    margin,
    purchases,
    externalCharges,
    payroll,
    taxes,
    financialCharges,
    amortizations,
    cashBalance,
    customerReceivables,
    supplierPayables,
    grossMargin,
    grossMarginRate,
    ebe,
    variableCosts,
    fixedCosts,
    contributionMargin,
    contributionMarginRate,
    breakevenPoint,
    safetyMargin,
    safetyMarginRate,
  }
}

function computeMonthly(entries: FecEntry[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>()
  let runningCash = 0

  // Tri par date pour calculer le solde de tresorerie cumule
  const sorted = [...entries].sort(
    (a, b) => a.ecritureDate.getTime() - b.ecritureDate.getTime()
  )

  for (const e of sorted) {
    const key = monthKey(e.ecritureDate)
    let bucket = map.get(key)
    if (!bucket) {
      bucket = {
        month: key,
        monthLabel: monthLabel(e.ecritureDate),
        revenue: 0,
        expenses: 0,
        result: 0,
        cashFlow: 0,
        cashBalance: 0,
      }
      map.set(key, bucket)
    }
    if (isRevenueAccount(e.compteNum)) {
      bucket.revenue += e.credit - e.debit
    }
    if (isExpenseAccount(e.compteNum)) {
      bucket.expenses += e.debit - e.credit
    }
    if (isCashAccount(e.compteNum)) {
      const delta = e.debit - e.credit
      bucket.cashFlow += delta
      runningCash += delta
      bucket.cashBalance = runningCash
    }
  }

  // Calcul du resultat et report du solde de cash sur les mois sans mouvement
  const sortedKeys = Array.from(map.keys()).sort()
  let lastBalance = 0
  for (const k of sortedKeys) {
    const point = map.get(k)!
    point.result = point.revenue - point.expenses
    if (point.cashFlow === 0) {
      point.cashBalance = lastBalance
    } else {
      lastBalance = point.cashBalance
    }
  }

  return sortedKeys.map((k) => map.get(k)!)
}

interface CategoryAccumulator {
  amount: number
}

function computeExpenseBreakdown(entries: FecEntry[]): CategoryBreakdown[] {
  const totals = new Map<string, CategoryAccumulator>()
  let total = 0

  for (const e of entries) {
    const cat = getExpenseCategory(e.compteNum)
    if (!cat) continue
    const amount = e.debit - e.credit
    if (amount === 0) continue
    const acc = totals.get(cat.label) ?? { amount: 0 }
    acc.amount += amount
    totals.set(cat.label, acc)
    total += amount
  }

  if (total <= 0) return []

  const items: CategoryBreakdown[] = []
  for (const cat of EXPENSE_CATEGORIES) {
    const acc = totals.get(cat.label)
    if (!acc || acc.amount <= 0) continue
    items.push({
      key: cat.key,
      label: cat.label,
      amount: acc.amount,
      share: (acc.amount / total) * 100,
    })
  }

  items.sort((a, b) => b.amount - a.amount)
  return assignExpenseFills(items)
}

function computeRevenueBreakdown(entries: FecEntry[]): CategoryBreakdown[] {
  const totals = new Map<string, CategoryAccumulator>()
  let total = 0

  for (const e of entries) {
    const cat = getRevenueCategory(e.compteNum)
    if (!cat) continue
    const amount = e.credit - e.debit
    if (amount === 0) continue
    const acc = totals.get(cat.label) ?? { amount: 0 }
    acc.amount += amount
    totals.set(cat.label, acc)
    total += amount
  }

  if (total <= 0) return []

  const items: CategoryBreakdown[] = []
  for (const cat of REVENUE_CATEGORIES) {
    const acc = totals.get(cat.label)
    if (!acc || acc.amount <= 0) continue
    items.push({
      key: cat.key,
      label: cat.label,
      amount: acc.amount,
      share: (acc.amount / total) * 100,
    })
  }

  items.sort((a, b) => b.amount - a.amount)
  return assignRevenueFills(items)
}

function computeTopCounterparties(
  entries: FecEntry[],
  predicate: (e: FecEntry) => boolean,
  amountFn: (e: FecEntry) => number,
  limit: number
): TopCounterparty[] {
  const map = new Map<string, TopCounterparty>()
  for (const e of entries) {
    if (!predicate(e)) continue
    const key = e.compAuxNum || e.compteNum
    const label = e.compAuxLib || e.compteLib || key
    const amount = amountFn(e)
    if (amount === 0) continue
    let item = map.get(key)
    if (!item) {
      item = {
        accountNum: key,
        label,
        amount: 0,
        entryCount: 0,
        lastDate: e.ecritureDate,
      }
      map.set(key, item)
    }
    item.amount += amount
    item.entryCount += 1
    if (e.ecritureDate > item.lastDate) {
      item.lastDate = e.ecritureDate
    }
  }
  const list = Array.from(map.values()).filter((c) => c.amount > 0)
  list.sort((a, b) => b.amount - a.amount)
  return list.slice(0, limit)
}

function computeCashByAccount(entries: FecEntry[]): TopCounterparty[] {
  const map = new Map<string, TopCounterparty>()
  for (const e of entries) {
    if (!isCashAccount(e.compteNum)) continue
    let item = map.get(e.compteNum)
    if (!item) {
      item = {
        accountNum: e.compteNum,
        label: e.compteLib || e.compteNum,
        amount: 0,
        entryCount: 0,
        lastDate: e.ecritureDate,
      }
      map.set(e.compteNum, item)
    }
    item.amount += e.debit - e.credit
    item.entryCount += 1
    if (e.ecritureDate > item.lastDate) {
      item.lastDate = e.ecritureDate
    }
  }
  const list = Array.from(map.values())
  list.sort((a, b) => b.amount - a.amount)
  return list
}

function computeInsights(
  kpi: KpiSummary,
  expenseCategories: CategoryBreakdown[],
  topCustomers: TopCounterparty[],
  topSuppliers: TopCounterparty[],
  monthly: MonthlyPoint[]
): ActionableInsight[] {
  const insights: ActionableInsight[] = []

  // Marge nette
  if (kpi.margin < 5 && kpi.revenue > 0) {
    insights.push({
      id: "low-margin",
      severity: kpi.margin < 0 ? "critical" : "warning",
      title:
        kpi.margin < 0
          ? "Votre activite est deficitaire sur la periode"
          : "Marge nette tres faible",
      description:
        kpi.margin < 0
          ? `Vous depensez plus que vous ne gagnez. Resultat net : ${formatEuro(kpi.netResult)}.`
          : `Votre marge nette est de ${kpi.margin.toFixed(1)}% du chiffre d'affaires.`,
      metric: `${kpi.margin.toFixed(1)}%`,
      action:
        "Identifiez les 2-3 postes de charges les plus lourds et fixez-vous un objectif de reduction de 10%.",
      category: "marge",
    })
  } else if (kpi.margin >= 15) {
    insights.push({
      id: "good-margin",
      severity: "positive",
      title: "Excellente marge nette",
      description: `Votre rentabilite est superieure a la moyenne (${kpi.margin.toFixed(1)}%).`,
      action: "Reinvestissez ce surplus dans l'acquisition client ou la R&D.",
      category: "marge",
    })
  }

  // Top categorie de charges
  if (expenseCategories.length > 0) {
    const top = expenseCategories[0]!
    if (top.share >= 40) {
      insights.push({
        id: `top-expense-${top.key}`,
        severity: "warning",
        title: `${top.label} represente ${top.share.toFixed(0)}% de vos charges`,
        description: `${formatEuro(top.amount)} sur la periode. Une reduction de 10% degagerait ${formatEuro(top.amount * 0.1)} de marge.`,
        action:
          top.key === "fixes"
            ? "Renegociez vos contrats fixes : loyer, telecoms, assurances, abonnements."
            : top.key === "rh"
              ? "Optimisez l'organisation du travail avant d'envisager des reductions d'effectifs."
              : top.key === "variables"
                ? "Renegociez vos achats : un volume groupe permet souvent 5-10% d'economies."
                : top.key === "acquisitions"
                  ? "Mesurez le ROI de chaque depense d'acquisition avant de la reconduire."
                  : "Auditez ce poste avec votre comptable pour identifier les economies possibles.",
        category: "charges",
      })
    }
  }

  // Concentration clients (risque d'effondrement si un client part)
  if (topCustomers.length >= 3) {
    const totalCustomerVolume = topCustomers.reduce((s, c) => s + c.amount, 0)
    const top3Share =
      totalCustomerVolume > 0
        ? (topCustomers.slice(0, 3).reduce((s, c) => s + c.amount, 0) /
            totalCustomerVolume) *
          100
        : 0
    if (top3Share >= 60) {
      insights.push({
        id: "client-concentration",
        severity: "warning",
        title: "Forte concentration de votre chiffre d'affaires",
        description: `Vos 3 plus gros clients pesent ${top3Share.toFixed(0)}% du volume client. Si l'un d'eux part, votre activite est fragilisee.`,
        action:
          "Lancez une action commerciale pour gagner 5 a 10 nouveaux clients d'ici 6 mois.",
        category: "clients",
      })
    }
  }

  // Concentration fournisseurs (levier de negociation)
  if (topSuppliers.length >= 3) {
    const totalSupplier = topSuppliers.reduce((s, c) => s + c.amount, 0)
    if (totalSupplier > 0) {
      const top1 = topSuppliers[0]!
      if ((top1.amount / totalSupplier) * 100 >= 30) {
        insights.push({
          id: "supplier-leverage",
          severity: "info",
          title: "Levier de negociation fournisseur",
          description: `${top1.label} represente une part importante de vos achats (${formatEuro(top1.amount)}). Vous avez du poids.`,
          action:
            "Demandez 3 devis concurrents et negociez 5 a 10% de remise sur volume.",
          category: "fournisseurs",
        })
      }
    }
  }

  // Tresorerie negative ou faible
  if (kpi.cashBalance < 0) {
    insights.push({
      id: "negative-cash",
      severity: "critical",
      title: "Tresorerie negative",
      description: `Votre solde bancaire cumule sur la periode est de ${formatEuro(kpi.cashBalance)}.`,
      action:
        "Accelerez le recouvrement clients (relances), ou negociez un decouvert / un PGE avec votre banque.",
      category: "tresorerie",
    })
  } else if (kpi.revenue > 0 && kpi.cashBalance < kpi.revenue * 0.05) {
    insights.push({
      id: "low-cash",
      severity: "warning",
      title: "Tresorerie tendue",
      description: `Votre tresorerie represente moins d'un mois de chiffre d'affaires.`,
      action:
        "Visez un matelas de 3 mois de charges fixes pour absorber les imprevus. Activez les relances clients.",
      category: "tresorerie",
    })
  }

  // Tendance CA (3 derniers mois vs 3 precedents)
  if (monthly.length >= 6) {
    const last3 = monthly.slice(-3).reduce((s, m) => s + m.revenue, 0)
    const prev3 = monthly.slice(-6, -3).reduce((s, m) => s + m.revenue, 0)
    if (prev3 > 0) {
      const growth = ((last3 - prev3) / prev3) * 100
      if (growth <= -10) {
        insights.push({
          id: "revenue-decline",
          severity: "warning",
          title: "Chiffre d'affaires en baisse",
          description: `Vos ventes des 3 derniers mois sont en recul de ${Math.abs(growth).toFixed(0)}% par rapport au trimestre precedent.`,
          action:
            "Lancez une campagne d'acquisition (ads, demarchage, partenariats) ou activez votre base existante (offre fidelite).",
          category: "ventes",
        })
      } else if (growth >= 15) {
        insights.push({
          id: "revenue-growth",
          severity: "positive",
          title: "Croissance forte du chiffre d'affaires",
          description: `+${growth.toFixed(0)}% sur les 3 derniers mois. Excellente dynamique.`,
          action:
            "Capitalisez : verrouillez les contrats clients, recrutez si necessaire, anticipez les besoins de tresorerie.",
          category: "ventes",
        })
      }
    }
  }

  // Creances clients elevees
  if (kpi.revenue > 0 && kpi.customerReceivables > kpi.revenue * 0.25) {
    const dso = (kpi.customerReceivables / kpi.revenue) * 365
    insights.push({
      id: "high-dso",
      severity: "warning",
      title: "Delai de paiement clients eleve",
      description: `Vos clients vous doivent ${formatEuro(kpi.customerReceivables)}, soit environ ${dso.toFixed(0)} jours de chiffre d'affaires.`,
      action:
        "Mettez en place des relances automatiques a J+15, J+30, J+45. Considerez l'affacturage si necessaire.",
      category: "clients",
    })
  }

  return insights
}

export function buildDashboardData(parseResult: FecParseResult): DashboardData {
  const { entries, meta, warnings } = parseResult
  const planWarnings = computeOfficialPlanWarnings(entries)

  const period = computePeriod(entries)
  const kpi = computeKpi(entries)
  const monthly = computeMonthly(entries)
  const expenseCategories = computeExpenseBreakdown(entries)
  const revenueCategories = computeRevenueBreakdown(entries)

  // Pour les top clients/fournisseurs, on veut le VOLUME total facture sur la periode,
  // pas le solde courant. Sur un compte 411xxx, le debit correspond aux factures emises.
  // Sur un 401xxx, le credit correspond aux factures recues.
  const topCustomers = computeTopCounterparties(
    entries,
    (e) =>
      isCustomerAccount(e.compteNum) &&
      (e.compAuxNum.length > 0 || e.compteNum.length > 3),
    (e) => e.debit,
    10
  )

  const topSuppliers = computeTopCounterparties(
    entries,
    (e) =>
      isSupplierAccount(e.compteNum) &&
      (e.compAuxNum.length > 0 || e.compteNum.length > 3),
    (e) => e.credit,
    10
  )

  const topExpenseAccounts = computeTopCounterparties(
    entries,
    (e) => isExpenseAccount(e.compteNum),
    (e) => e.debit - e.credit,
    10
  )

  const topRevenueAccounts = computeTopCounterparties(
    entries,
    (e) => isRevenueAccount(e.compteNum),
    (e) => e.credit - e.debit,
    10
  )

  const cashByAccount = computeCashByAccount(entries)

  const agedReceivables = computeAgedReceivables(entries, period.endDate)
  const agedPayables = computeAgedPayables(entries, period.endDate)

  const cashProjection = computeCashProjection(entries, period.endDate, {
    currentCash: kpi.cashBalance,
    overduePayables: agedPayables.overdueAmount,
    overdueReceivables: agedReceivables.overdueAmount,
  })

  const insights = computeInsights(
    kpi,
    expenseCategories,
    topCustomers,
    topSuppliers,
    monthly
  )

  return {
    meta,
    period,
    kpi,
    monthly,
    expenseCategories,
    revenueCategories,
    topCustomers,
    topSuppliers,
    topExpenseAccounts,
    topRevenueAccounts,
    insights,
    cashByAccount,
    agedReceivables,
    agedPayables,
    cashProjection,
    warnings: [...warnings, ...planWarnings],
  }
}

// Re-export des types et constantes pour les composants
export type { ExpenseCategory, RevenueCategory }
export { EXPENSE_CATEGORIES, REVENUE_CATEGORIES, getAccountClass }
