"use client"

import { Badge } from "@workspace/ui/components/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { Calendar } from "lucide-react"
import { usePathname } from "next/navigation"

import { formatShortDate } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Vue d'ensemble",
  "/dashboard/insights": "Actions à mener",
  "/dashboard/revenus": "Revenus",
  "/dashboard/charges": "Charges",
  "/dashboard/tresorerie": "Trésorerie",
  "/dashboard/clients": "Clients",
  "/dashboard/fournisseurs": "Fournisseurs",
}

export function DashboardHeader() {
  const pathname = usePathname() ?? "/dashboard"
  const { data } = useFecStore()
  const pageLabel = PAGE_LABELS[pathname] ?? "Tableau de bord"
  const isOverview = pathname === "/dashboard"

  return (
    <div className="flex w-full items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">Tableau de bord</BreadcrumbLink>
          </BreadcrumbItem>
          {isOverview ? null : (
            <>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {isOverview ? (
            <BreadcrumbItem>
              <BreadcrumbPage className="md:hidden">{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      {data ? (
        <Badge variant="secondary" className="hidden gap-1.5 md:inline-flex">
          <Calendar className="size-3" />
          <span>
            {formatShortDate(data.period.startDate)} →{" "}
            {formatShortDate(data.period.endDate)}
          </span>
        </Badge>
      ) : null}
    </div>
  )
}
