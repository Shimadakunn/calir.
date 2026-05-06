"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { ReactNode } from "react"

import {
  assignExpenseFills,
  assignRevenueFills,
  buildDashboardData,
  type DashboardData,
} from "./analytics"
import { parseFecFile } from "./parser"

// v7 (2026-05) : rattachement des comptes au plan de comptes officiel 2026 et
// separation des categories metier clair.
// v6 (2026-05) : ajout de cashProjection (projection de tresorerie a court
// terme : solde actuel +/- engagements echus envers fournisseurs / Etat /
// personnel / organismes sociaux).
// v5 (2026-05) : ajout de notDuePartyCount dans AgedBalance pour symetriser
// avec overduePartyCount (nb de tiers ayant des factures non echues).
// v4 (2026-05) : ajout de la balance agee (agedReceivables, agedPayables) avec
// matching FIFO par tiers et bucketing 0-30 / 31-60 / +60 jours.
// v3 (2026-05) : ajout des champs seuil de rentabilite dans KpiSummary
// (variableCosts, fixedCosts, contributionMargin, breakevenPoint, ...).
// v2 (2026-05) : refonte de la categorisation des comptes
// (Couts fixes/RH/Variables/... au lieu des classes PCG 60-69).
// Les utilisateurs avec un snapshot anterieur devront re-importer leur FEC.
const STORAGE_KEY = "clair.fec.dashboard.v7"
// Slot secondaire pour la comparaison entre deux FEC (meme schema, meme version).
const COMPARISON_STORAGE_KEY = "clair.fec.dashboard.comparison.v7"

interface SerializedSnapshot {
  meta: DashboardData["meta"]
  period: {
    startDate: string
    endDate: string
    fiscalYear: number
    monthsCovered: number
  }
  kpi: DashboardData["kpi"]
  monthly: DashboardData["monthly"]
  expenseCategories: DashboardData["expenseCategories"]
  revenueCategories: DashboardData["revenueCategories"]
  topCustomers: Array<
    Omit<DashboardData["topCustomers"][number], "lastDate"> & {
      lastDate: string
    }
  >
  topSuppliers: Array<
    Omit<DashboardData["topSuppliers"][number], "lastDate"> & {
      lastDate: string
    }
  >
  topExpenseAccounts: Array<
    Omit<DashboardData["topExpenseAccounts"][number], "lastDate"> & {
      lastDate: string
    }
  >
  topRevenueAccounts: Array<
    Omit<DashboardData["topRevenueAccounts"][number], "lastDate"> & {
      lastDate: string
    }
  >
  cashByAccount: Array<
    Omit<DashboardData["cashByAccount"][number], "lastDate"> & {
      lastDate: string
    }
  >
  insights: DashboardData["insights"]
  agedReceivables: Omit<DashboardData["agedReceivables"], "asOf"> & {
    asOf: string
  }
  agedPayables: Omit<DashboardData["agedPayables"], "asOf"> & {
    asOf: string
  }
  cashProjection: Omit<DashboardData["cashProjection"], "asOf"> & {
    asOf: string
  }
  warnings: string[]
}

function stripFill(items: DashboardData["expenseCategories"]) {
  return items.map(({ key, label, amount, share }) => ({
    key,
    label,
    amount,
    share,
  }))
}

function serialize(data: DashboardData): SerializedSnapshot {
  return {
    meta: data.meta,
    period: {
      startDate: data.period.startDate.toISOString(),
      endDate: data.period.endDate.toISOString(),
      fiscalYear: data.period.fiscalYear,
      monthsCovered: data.period.monthsCovered,
    },
    kpi: data.kpi,
    monthly: data.monthly,
    // `fill` est de la presentation, on le retire avant persistence pour qu'un
    // changement de palette dans globals.css prenne effet sans re-upload.
    expenseCategories: stripFill(data.expenseCategories),
    revenueCategories: stripFill(data.revenueCategories),
    topCustomers: data.topCustomers.map((c) => ({
      ...c,
      lastDate: c.lastDate.toISOString(),
    })),
    topSuppliers: data.topSuppliers.map((c) => ({
      ...c,
      lastDate: c.lastDate.toISOString(),
    })),
    topExpenseAccounts: data.topExpenseAccounts.map((c) => ({
      ...c,
      lastDate: c.lastDate.toISOString(),
    })),
    topRevenueAccounts: data.topRevenueAccounts.map((c) => ({
      ...c,
      lastDate: c.lastDate.toISOString(),
    })),
    cashByAccount: data.cashByAccount.map((c) => ({
      ...c,
      lastDate: c.lastDate.toISOString(),
    })),
    insights: data.insights,
    agedReceivables: {
      ...data.agedReceivables,
      asOf: data.agedReceivables.asOf.toISOString(),
    },
    agedPayables: {
      ...data.agedPayables,
      asOf: data.agedPayables.asOf.toISOString(),
    },
    cashProjection: {
      ...data.cashProjection,
      asOf: data.cashProjection.asOf.toISOString(),
    },
    warnings: data.warnings,
  }
}

function deserialize(snap: SerializedSnapshot): DashboardData {
  return {
    meta: {
      ...snap.meta,
      minDate: snap.meta.minDate
        ? new Date(snap.meta.minDate as unknown as string)
        : null,
      maxDate: snap.meta.maxDate
        ? new Date(snap.meta.maxDate as unknown as string)
        : null,
    },
    period: {
      startDate: new Date(snap.period.startDate),
      endDate: new Date(snap.period.endDate),
      fiscalYear: snap.period.fiscalYear,
      monthsCovered: snap.period.monthsCovered,
    },
    kpi: snap.kpi,
    monthly: snap.monthly,
    // Les fills ne sont pas persistes : on les recalcule a partir de la palette
    // courante. Cela garantit la coherence visuelle apres chaque changement de
    // theme sans necessiter de re-upload du FEC.
    expenseCategories: assignExpenseFills(snap.expenseCategories),
    revenueCategories: assignRevenueFills(snap.revenueCategories),
    topCustomers: snap.topCustomers.map((c) => ({
      ...c,
      lastDate: new Date(c.lastDate),
    })),
    topSuppliers: snap.topSuppliers.map((c) => ({
      ...c,
      lastDate: new Date(c.lastDate),
    })),
    topExpenseAccounts: snap.topExpenseAccounts.map((c) => ({
      ...c,
      lastDate: new Date(c.lastDate),
    })),
    topRevenueAccounts: snap.topRevenueAccounts.map((c) => ({
      ...c,
      lastDate: new Date(c.lastDate),
    })),
    cashByAccount: snap.cashByAccount.map((c) => ({
      ...c,
      lastDate: new Date(c.lastDate),
    })),
    insights: snap.insights,
    agedReceivables: {
      ...snap.agedReceivables,
      asOf: new Date(snap.agedReceivables.asOf),
    },
    agedPayables: {
      ...snap.agedPayables,
      asOf: new Date(snap.agedPayables.asOf),
    },
    cashProjection: {
      ...snap.cashProjection,
      asOf: new Date(snap.cashProjection.asOf),
    },
    warnings: snap.warnings,
  }
}

function loadSnapshot(key: string): DashboardData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return deserialize(JSON.parse(raw) as SerializedSnapshot)
  } catch {
    window.localStorage.removeItem(key)
    return null
  }
}

async function buildDemoFile(): Promise<File> {
  const { generateDemoFecText } = await import("./demo")
  const text = generateDemoFecText()
  const blob = new Blob([text], { type: "text/plain" })
  return new File([blob], "demo-clair.txt", { type: "text/plain" })
}

type ImportState =
  | { status: "idle" }
  | { status: "parsing"; fileName: string }
  | { status: "ready" }
  | { status: "error"; message: string }

interface FecStoreValue {
  data: DashboardData | null
  hydrated: boolean
  importState: ImportState
  importFile: (file: File) => Promise<void>
  importDemo: () => Promise<void>
  importDashboardData: (data: DashboardData) => void
  reset: () => void
  // Slot secondaire utilise pour comparer un second FEC au FEC principal.
  comparisonData: DashboardData | null
  comparisonImportState: ImportState
  importComparisonFile: (file: File) => Promise<void>
  importComparisonDemo: () => Promise<void>
  resetComparison: () => void
}

const FecStoreContext = createContext<FecStoreValue | null>(null)

export function FecStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [comparisonData, setComparisonData] = useState<DashboardData | null>(
    null
  )
  const [hydrated, setHydrated] = useState(false)
  const [importState, setImportState] = useState<ImportState>({
    status: "idle",
  })
  const [comparisonImportState, setComparisonImportState] =
    useState<ImportState>({ status: "idle" })

  useEffect(() => {
    const primary = loadSnapshot(STORAGE_KEY)
    if (primary) {
      setData(primary)
      setImportState({ status: "ready" })
    }
    const comparison = loadSnapshot(COMPARISON_STORAGE_KEY)
    if (comparison) {
      setComparisonData(comparison)
      setComparisonImportState({ status: "ready" })
    }
    setHydrated(true)
  }, [])

  // Generique : parse + persiste + met a jour le slot cible. Permet de mutualiser
  // la logique entre le FEC principal et le FEC de comparaison.
  const runImport = useCallback(
    async (
      file: File,
      storageKey: string,
      setSlotData: (d: DashboardData) => void,
      setSlotState: (s: ImportState) => void,
      fallbackError: string
    ) => {
      setSlotState({ status: "parsing", fileName: file.name })
      try {
        const parsed = await parseFecFile(file)
        const dashboard = buildDashboardData(parsed)
        setSlotData(dashboard)
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(serialize(dashboard))
        )
        setSlotState({ status: "ready" })
      } catch (error) {
        const message = error instanceof Error ? error.message : fallbackError
        setSlotState({ status: "error", message })
        throw error
      }
    },
    []
  )

  const importFile = useCallback(
    (file: File) =>
      runImport(
        file,
        STORAGE_KEY,
        setData,
        setImportState,
        "Une erreur est survenue lors de l'analyse du fichier."
      ),
    [runImport]
  )

  const importDemo = useCallback(async () => {
    const file = await buildDemoFile()
    await runImport(
      file,
      STORAGE_KEY,
      setData,
      setImportState,
      "Erreur lors du chargement du jeu de demonstration."
    )
  }, [runImport])

  const importComparisonFile = useCallback(
    (file: File) =>
      runImport(
        file,
        COMPARISON_STORAGE_KEY,
        setComparisonData,
        setComparisonImportState,
        "Une erreur est survenue lors de l'analyse du fichier."
      ),
    [runImport]
  )

  const importComparisonDemo = useCallback(async () => {
    const file = await buildDemoFile()
    await runImport(
      file,
      COMPARISON_STORAGE_KEY,
      setComparisonData,
      setComparisonImportState,
      "Erreur lors du chargement du jeu de demonstration."
    )
  }, [runImport])

  const importDashboardData = useCallback((next: DashboardData) => {
    setData(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(next)))
    setImportState({ status: "ready" })
  }, [])

  const resetComparison = useCallback(() => {
    setComparisonData(null)
    setComparisonImportState({ status: "idle" })
    if (typeof window !== "undefined")
      window.localStorage.removeItem(COMPARISON_STORAGE_KEY)
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setImportState({ status: "idle" })
    setComparisonData(null)
    setComparisonImportState({ status: "idle" })
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(COMPARISON_STORAGE_KEY)
    }
  }, [])

  const value = useMemo<FecStoreValue>(
    () => ({
      data,
      hydrated,
      importState,
      importFile,
      importDemo,
      importDashboardData,
      reset,
      comparisonData,
      comparisonImportState,
      importComparisonFile,
      importComparisonDemo,
      resetComparison,
    }),
    [
      data,
      hydrated,
      importState,
      importFile,
      importDemo,
      importDashboardData,
      reset,
      comparisonData,
      comparisonImportState,
      importComparisonFile,
      importComparisonDemo,
      resetComparison,
    ]
  )

  return (
    <FecStoreContext.Provider value={value}>
      {children}
    </FecStoreContext.Provider>
  )
}

export function useFecStore(): FecStoreValue {
  const ctx = useContext(FecStoreContext)
  if (!ctx) {
    throw new Error("useFecStore must be used within a FecStoreProvider")
  }
  return ctx
}
