"use client"

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"

import type { MonthlyPoint } from "@/lib/fec/analytics"
import { formatEuroCompact, formatEuroExact } from "@/lib/fec/format"

const balanceConfig = {
  cashBalance: { label: "Solde", color: "var(--chart-3)" },
} satisfies ChartConfig

const flowConfig = {
  cashFlow: { label: "Flux net", color: "var(--chart-2)" },
} satisfies ChartConfig

// On enregistre toujours les cles "*Comparison" dans le ChartConfig pour
// preserver un ordre stable des series : recharts re-enregistre une serie
// remontee a la fin de sa liste interne lors d'un toggle, ce qui inverse
// l'ordre visuel (vu sur recharts 3.8.0). Meme strategie que MonthlyBarChart.
const combinedConfig = {
  cashBalance: { label: "Solde", color: "var(--chart-3)" },
  cashFlow: { label: "Flux net", color: "var(--chart-2)" },
  cashBalanceComparison: { label: "Solde comparé", color: "var(--chart-1)" },
  cashFlowComparison: { label: "Flux comparé", color: "var(--chart-1)" },
} satisfies ChartConfig

function formatEuroAxis(value: number): string {
  return formatEuroCompact(value)
}

// Helper pour generer les Cells colorees d'un Bar de flux : meme semantique
// signe-couleur (positif/negatif) appliquee aux barres primaires et de
// comparaison. Recharts deballe les Cells passees comme children de Bar.
function flowCells(
  values: Array<{ key: string; value: number }>,
  positiveFill: string,
  negativeFill: string
) {
  return values.map(({ key, value }) => (
    <Cell key={key} fill={value >= 0 ? positiveFill : negativeFill} />
  ))
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

export function CashBalanceChart({
  monthly,
  className,
}: {
  monthly: MonthlyPoint[]
  className?: string
}) {
  return (
    <ChartContainer config={balanceConfig} className={className}>
      <AreaChart data={monthly}>
        <defs>
          <linearGradient id="cashBalanceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-cashBalance)"
              stopOpacity={0.5}
            />
            <stop
              offset="100%"
              stopColor="var(--color-cashBalance)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
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
          cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
          content={<ChartTooltipContent formatter={tooltipFormatter} />}
        />
        <Area
          type="monotone"
          dataKey="cashBalance"
          stroke="var(--color-cashBalance)"
          fill="url(#cashBalanceGradient)"
          strokeWidth={2.5}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function CashFlowChart({
  monthly,
  className,
}: {
  monthly: MonthlyPoint[]
  className?: string
}) {
  return (
    <ChartContainer config={flowConfig} className={className}>
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
        <Bar dataKey="cashFlow" radius={[4, 4, 0, 0]}>
          {monthly.map((m) => (
            <Cell
              key={m.month}
              fill={m.cashFlow >= 0 ? "var(--chart-2)" : "var(--destructive)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export function CashCombinedChart({
  monthly,
  comparison,
  className,
}: {
  monthly: MonthlyPoint[]
  // Comparaison alignee par index (m1 primary <-> m1 compare), comme MonthlyBarChart.
  comparison?: MonthlyPoint[]
  className?: string
}) {
  const hasComparison = Boolean(comparison && comparison.length > 0)
  const data = monthly.map((m, i) => ({
    ...m,
    cashBalanceComparison: comparison?.[i]?.cashBalance ?? null,
    cashFlowComparison: comparison?.[i]?.cashFlow ?? null,
  }))
  const primaryFlow = monthly.map((m) => ({ key: m.month, value: m.cashFlow }))
  const comparisonFlow = monthly.map((m, i) => ({
    key: m.month,
    value: comparison?.[i]?.cashFlow ?? 0,
  }))

  return (
    <ChartContainer config={combinedConfig} className={className}>
      <ComposedChart data={data}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="monthLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
        />
        <YAxis
          yAxisId="balance"
          orientation="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatEuroAxis}
          width={60}
        />
        <YAxis
          yAxisId="flow"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={formatEuroAxis}
          width={60}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
          content={<ChartTooltipContent formatter={tooltipFormatter} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {/* Series de comparaison rendues AVANT les primaires + always-mounted
            (hide via prop) pour preserver l'ordre des series sur recharts 3.8.0. */}
        <Line
          yAxisId="balance"
          type="monotone"
          dataKey="cashBalanceComparison"
          stroke="var(--color-cashBalanceComparison)"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          activeDot={{ r: 3 }}
          hide={!hasComparison}
          connectNulls
        />
        <Bar
          yAxisId="flow"
          dataKey="cashFlowComparison"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          fillOpacity={0.55}
          hide={!hasComparison}
        >
          {flowCells(comparisonFlow, "var(--chart-1)", "var(--destructive-1)")}
        </Bar>
        <Line
          yAxisId="balance"
          type="monotone"
          dataKey="cashBalance"
          stroke="var(--color-cashBalance)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Bar
          yAxisId="flow"
          dataKey="cashFlow"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          fillOpacity={0.65}
        >
          {flowCells(primaryFlow, "var(--chart-2)", "var(--destructive)")}
        </Bar>
      </ComposedChart>
    </ChartContainer>
  )
}
