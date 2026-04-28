"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  TriangleAlert,
} from "lucide-react"

import { DashboardEmptyState } from "@/components/fec/empty-state"
import { FormattedNumber } from "@/components/fec/formatted-number"
import { InsightCard } from "@/components/fec/insight-card"
import { useFecStore } from "@/lib/fec/store"

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
}

export default function InsightsPage() {
  const { data } = useFecStore()
  if (!data) return <DashboardEmptyState />

  const sorted = [...data.insights].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)
  )

  const counts = {
    critical: sorted.filter((i) => i.severity === "critical").length,
    warning: sorted.filter((i) => i.severity === "warning").length,
    info: sorted.filter((i) => i.severity === "info").length,
    positive: sorted.filter((i) => i.severity === "positive").length,
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Actions à mener
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Synthèse des leviers détectés sur vos comptes — du plus urgent au plus
          stratégique
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SeverityStat
          label="Critique"
          count={counts.critical}
          icon={TriangleAlert}
          tone="danger"
        />
        <SeverityStat
          label="Attention"
          count={counts.warning}
          icon={CircleAlert}
          tone="warning"
        />
        <SeverityStat
          label="Opportunité"
          count={counts.info}
          icon={Lightbulb}
          tone="info"
        />
        <SeverityStat
          label="Bonne nouvelle"
          count={counts.positive}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {sorted.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tout va bien</CardTitle>
            <CardDescription>
              Aucune alerte significative détectée sur la période analysée.
              Continuez sur cette lancée.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 rounded-lg bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-500">
              <CheckCircle2 className="size-5 shrink-0" />
              <p>
                Vos indicateurs financiers sont dans les clous : marge correcte,
                pas de concentration excessive, trésorerie saine.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sorted.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  )
}

function SeverityStat({
  label,
  count,
  icon: Icon,
  tone,
}: {
  label: string
  count: number
  icon: typeof CheckCircle2
  tone: "danger" | "warning" | "info" | "success"
}) {
  const styles: Record<typeof tone, { card: string; text: string }> = {
    danger: {
      card: "border-destructive/30 bg-destructive/[0.04]",
      text: "text-destructive",
    },
    warning: {
      card: "border-amber-500/30 bg-amber-500/[0.05]",
      text: "text-amber-700 dark:text-amber-500",
    },
    info: {
      card: "border-blue-500/30 bg-blue-500/[0.04]",
      text: "text-blue-700 dark:text-blue-400",
    },
    success: {
      card: "border-emerald-500/30 bg-emerald-500/[0.04]",
      text: "text-emerald-700 dark:text-emerald-500",
    },
  }
  return (
    <Card className={`gap-2 ${styles[tone].card}`}>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <Icon className={`size-4 ${styles[tone].text}`} />
        </div>
        <p className="mt-2 font-heading text-3xl font-bold tabular-nums">
          <FormattedNumber value={count} />
        </p>
      </CardContent>
    </Card>
  )
}
