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

import { buildDashboardData, type DashboardData } from "./analytics"
import { parseFecFile } from "./parser"

const STORAGE_KEY = "clair.fec.dashboard.v1"

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
  warnings: string[]
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
    expenseCategories: data.expenseCategories,
    revenueCategories: data.revenueCategories,
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
    expenseCategories: snap.expenseCategories,
    revenueCategories: snap.revenueCategories,
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
    warnings: snap.warnings,
  }
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
}

const FecStoreContext = createContext<FecStoreValue | null>(null)

export function FecStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [importState, setImportState] = useState<ImportState>({
    status: "idle",
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as SerializedSnapshot
        setData(deserialize(parsed))
        setImportState({ status: "ready" })
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    } finally {
      setHydrated(true)
    }
  }, [])

  const importFile = useCallback(async (file: File) => {
    setImportState({ status: "parsing", fileName: file.name })
    try {
      const parsed = await parseFecFile(file)
      const dashboard = buildDashboardData(parsed)
      setData(dashboard)
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(serialize(dashboard))
      )
      setImportState({ status: "ready" })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de l'analyse du fichier."
      setImportState({ status: "error", message })
      throw error
    }
  }, [])

  const importDemo = useCallback(async () => {
    setImportState({ status: "parsing", fileName: "demo-fec.txt" })
    try {
      const { generateDemoFecText } = await import("./demo")
      const text = generateDemoFecText()
      const blob = new Blob([text], { type: "text/plain" })
      const file = new File([blob], "demo-clair.txt", { type: "text/plain" })
      const parsed = await parseFecFile(file)
      const dashboard = buildDashboardData(parsed)
      setData(dashboard)
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(serialize(dashboard))
      )
      setImportState({ status: "ready" })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors du chargement du jeu de demonstration."
      setImportState({ status: "error", message })
      throw error
    }
  }, [])

  const importDashboardData = useCallback((next: DashboardData) => {
    setData(next)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(next)))
    setImportState({ status: "ready" })
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setImportState({ status: "idle" })
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY)
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
    }),
    [
      data,
      hydrated,
      importState,
      importFile,
      importDemo,
      importDashboardData,
      reset,
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
