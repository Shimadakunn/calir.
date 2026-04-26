"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"

import type { MonthlyPoint } from "@/lib/fec/analytics"

function formatEuroAxis(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `${(value / 1_000_000).toFixed(1)}M €`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}k €`
  return `${String(Math.round(value))} €`
}

function tooltipFormatter(value: unknown, name: unknown) {
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value)
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-muted-foreground capitalize">
        {String(name ?? "")}
      </span>
      <span className="font-mono font-medium">
        {new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(Number.isFinite(numeric) ? numeric : 0)}
      </span>
    </div>
  )
}

interface MonthlyBarChartProps {
  monthly: MonthlyPoint[]
  metric: "revenue" | "expenses" | "result"
  className?: string
}

const METRIC_CONFIG: Record<MonthlyBarChartProps["metric"], ChartConfig> = {
  revenue: { revenue: { label: "Revenus", color: "var(--chart-2)" } },
  expenses: { expenses: { label: "Charges", color: "var(--chart-4)" } },
  result: { result: { label: "Résultat", color: "var(--chart-3)" } },
}

export function MonthlyBarChart({
  monthly,
  metric,
  className,
}: MonthlyBarChartProps) {
  const config = METRIC_CONFIG[metric]
  const fillVar = `var(--color-${metric})`

  return (
    <ChartContainer config={config} className={className}>
      <BarChart data={monthly}>
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
        <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
          {monthly.map((m) => {
            const value = m[metric]
            return (
              <Cell
                key={m.month}
                fill={
                  metric === "result" && value < 0
                    ? "var(--destructive)"
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
