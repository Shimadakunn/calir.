"use client"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import type { MonthlyPoint } from "@/lib/fec/analytics"
import { formatEuroCompact, formatEuroExact } from "@/lib/fec/format"

function formatEuroAxis(value: number): string {
  return formatEuroCompact(value)
}

function tooltipFormatter(value: unknown, name: unknown) {
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value)
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-muted-foreground capitalize">
        {String(name ?? "")}
      </span>
      <span className="font-mono font-medium">
        {formatEuroExact(Number.isFinite(numeric) ? numeric : 0)}
      </span>
    </div>
  )
}

type Metric = "revenue" | "expenses" | "result"

interface MonthlyBarChartProps {
  monthly: MonthlyPoint[]
  metric: Metric
  // FEC de comparaison aligne par index (mois 1 du primary <-> mois 1 du compare).
  // Choix delibere : on ne tente pas d'aligner par date pour permettre les YoY
  // sur des exercices decales.
  comparison?: MonthlyPoint[]
  className?: string
}

const METRIC_LABEL: Record<Metric, string> = {
  revenue: "Revenus",
  expenses: "Charges",
  result: "Résultat",
}

const METRIC_COLOR: Record<Metric, string> = {
  revenue: "var(--revenue)",
  expenses: "var(--expense)",
  result: "var(--result)",
}

// Couleur dediee a la barre de comparaison : variante claire (-1) de la
// meme famille que la metrique principale, pour respecter le code couleur
// de chaque page (bleu sur /revenus, orange sur /charges).
// Pas de variante claire pour "result" : on retombe sur la couleur primaire.
const COMPARISON_COLOR: Record<Metric, string> = {
  revenue: "var(--revenue-1)",
  expenses: "var(--expense-1)",
  result: "var(--result)",
}

const COMPARISON_KEY = "comparison"

export function MonthlyBarChart({
  monthly,
  metric,
  comparison,
  className,
}: MonthlyBarChartProps) {
  const fillVar = `var(--color-${metric})`
  const hasComparison = Boolean(comparison && comparison.length > 0)

  // On enregistre toujours `comparison` dans le ChartConfig pour conserver
  // un ordre stable des elements du chart : sinon recharts re-enregistre la
  // barre a la fin de sa liste interne lors d'un toggle, ce qui inverse
  // l'ordre visuel (vu sur recharts 3.8.0).
  const config = {
    [metric]: { label: METRIC_LABEL[metric], color: METRIC_COLOR[metric] },
    [COMPARISON_KEY]: {
      label: "FEC comparé",
      color: COMPARISON_COLOR[metric],
    },
  } satisfies ChartConfig

  const data = monthly.map((m, i) => ({
    ...m,
    [COMPARISON_KEY]: comparison?.[i]?.[metric] ?? null,
  }))

  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="monthLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatEuroAxis}
          width={60}
        />
        <ChartTooltip
          content={<ChartTooltipContent formatter={tooltipFormatter} />}
        />
        {/* On rend la barre comparison meme quand inactive et on la masque
            via `hide` : recharts filtre les bars cachees du calcul de layout
            (selectAllVisibleBars dans barSelectors.js) tout en preservant
            leur ordre d'enregistrement. Avec un demontage conditionnel, le
            re-mount enregistre la barre a la fin et la fait basculer a
            droite au lieu de rester a gauche. */}
        <Bar
          dataKey={COMPARISON_KEY}
          fill="var(--color-comparison)"
          radius={[4, 4, 0, 0]}
          hide={!hasComparison}
        />
        <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
          {monthly.map((m) => {
            const value = m[metric]
            return (
              <Cell
                key={m.month}
                fill={
                  metric === "result" && value < 0
                    ? "var(--result-loss)"
                    : fillVar
                }
              />
            )
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
