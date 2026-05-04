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
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  formatEuroAxis,
  tooltipFormatter,
} from "@/components/fec/cash-chart-helpers"
import type { MonthlyPoint } from "@/lib/fec/analytics"

// Icones custom pour les entrees forecast de la legende : la pastille par
// defaut ne sait pas representer une ligne pointillee ni des hachures. On
// les redefinit explicitement pour signaler "estime / projete".
function ForecastBalanceIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none">
      <path
        d="M1 6 H11"
        stroke="var(--color-cashBalanceForecast)"
        strokeWidth="2"
        strokeDasharray="3 2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ForecastFlowIcon() {
  return (
    <svg viewBox="0 0 12 12">
      <rect
        width="12"
        height="12"
        fill="var(--color-cashFlowForecast)"
        fillOpacity="0.2"
        rx="2"
      />
      <path
        d="M0 6 L6 0 M0 12 L12 0 M6 12 L12 6"
        stroke="var(--color-cashFlowForecast)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

const combinedConfig = {
  cashBalance: { label: "Solde", color: "var(--chart-3)" },
  cashFlow: { label: "Flux net", color: "var(--chart-2)" },
  cashBalanceComparison: { label: "Solde comparé", color: "var(--chart-1)" },
  cashFlowComparison: { label: "Flux comparé", color: "var(--chart-1)" },
  cashBalanceForecast: {
    label: "Solde prévisionnel",
    color: "var(--chart-3)",
    icon: ForecastBalanceIcon,
  },
  cashFlowForecast: {
    label: "Flux prévisionnel",
    color: "var(--chart-2)",
    icon: ForecastFlowIcon,
  },
} satisfies ChartConfig

interface CashProjectionCombinedPoint {
  label: string
  balance: number
  flow: number
}

function flowCells(
  values: Array<{ key: string; value: number }>,
  positiveFill: string,
  negativeFill: string
) {
  return values.map(({ key, value }) => (
    <Cell key={key} fill={value >= 0 ? positiveFill : negativeFill} />
  ))
}

function CombinedBalanceGradients() {
  return (
    <>
      <linearGradient
        id="cashBalanceCombinedGradient"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
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
      <linearGradient
        id="cashBalanceComparisonGradient"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="0%"
          stopColor="var(--color-cashBalanceComparison)"
          stopOpacity={0.2}
        />
        <stop
          offset="100%"
          stopColor="var(--color-cashBalanceComparison)"
          stopOpacity={0.02}
        />
      </linearGradient>
      <linearGradient
        id="cashBalanceForecastCombinedGradient"
        x1="0"
        y1="0"
        x2="0"
        y2="1"
      >
        <stop
          offset="0%"
          stopColor="var(--color-cashBalance)"
          stopOpacity={0.18}
        />
        <stop
          offset="100%"
          stopColor="var(--color-cashBalance)"
          stopOpacity={0.02}
        />
      </linearGradient>
    </>
  )
}

type CombinedDatum = Omit<MonthlyPoint, "cashBalance" | "cashFlow"> & {
  cashBalance: number | null
  cashFlow: number | null
  cashBalanceComparison: number | null
  cashFlowComparison: number | null
  cashBalanceForecast: number | null
  cashFlowForecast: number | null
}

function buildCombinedChartData(
  monthly: MonthlyPoint[],
  comparison: MonthlyPoint[] | undefined,
  projection: CashProjectionCombinedPoint | undefined
) {
  const data: CombinedDatum[] = monthly.map((m, i) => ({
    ...m,
    cashBalanceComparison: comparison?.[i]?.cashBalance ?? null,
    cashFlowComparison: comparison?.[i]?.cashFlow ?? null,
    cashBalanceForecast: null,
    cashFlowForecast: null,
  }))

  if (projection) {
    // Bridge : duplique le dernier solde sur cashBalanceForecast pour que la
    // zone pointillee se raccorde sans trou. Le bar n'a pas besoin de bridge
    // (les barres ne sont pas connectees entre elles).
    const last = data.at(-1)
    if (last) last.cashBalanceForecast = last.cashBalance
    data.push({
      month: "__forecast__",
      monthLabel: projection.label,
      revenue: 0,
      expenses: 0,
      result: 0,
      cashBalance: null,
      cashFlow: null,
      cashBalanceComparison: null,
      cashFlowComparison: null,
      cashBalanceForecast: projection.balance,
      cashFlowForecast: projection.flow,
    })
  }

  const primaryFlow = monthly.map((m) => ({ key: m.month, value: m.cashFlow }))
  const comparisonFlow = monthly.map((m, i) => ({
    key: m.month,
    value: comparison?.[i]?.cashFlow ?? 0,
  }))
  // ALIGNEMENT CRITIQUE : recharts mappe les <Cell> par INDEX a `data`. Ce
  // tableau doit donc avoir exactement la meme longueur que `data` — sinon le
  // Cell pour le point projete tombe sur la mauvaise position et le bar perd
  // sa coloration (fallback noir/transparent).
  const forecastFlow = data.map((d) => ({
    key: d.month,
    value: d.cashFlowForecast ?? 0,
  }))
  return { data, primaryFlow, comparisonFlow, forecastFlow }
}

// Series de comparaison : conditional mount (pas always-mount + hide). Cacher
// une serie ne libere pas son slot dans le groupe de bars sur le meme xAxisId
// — du coup le bar primaire se decale a gauche du tick. Mounter conditionnellement
// resout le decalage. Trade-off : layout shift au toggle sur /tresorerie.
function CombinedComparisonSeries({
  comparisonFlow,
}: {
  comparisonFlow: Array<{ key: string; value: number }>
}) {
  return (
    <>
      <Area
        yAxisId="balance"
        type="monotone"
        dataKey="cashBalanceComparison"
        stroke="var(--color-cashBalanceComparison)"
        fill="url(#cashBalanceComparisonGradient)"
        strokeWidth={2}
        strokeDasharray="4 4"
        dot={false}
        activeDot={{ r: 3 }}
        connectNulls
      />
      <Bar
        yAxisId="flow"
        dataKey="cashFlowComparison"
        radius={[4, 4, 0, 0]}
        maxBarSize={28}
        fill="var(--chart-1)"
        fillOpacity={0.55}
      >
        {flowCells(comparisonFlow, "var(--chart-1)", "var(--destructive-1)")}
      </Bar>
    </>
  )
}

// Patterns SVG hachures pour la barre forecast : signal visuel "estimation /
// non confirme" reconnaissable.
function CombinedForecastBarPatterns() {
  return (
    <>
      <pattern
        id="cashFlowForecastPositivePattern"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
      >
        <rect width="6" height="6" fill="var(--chart-2)" fillOpacity={0.18} />
        <line
          x1="0"
          y1="6"
          x2="6"
          y2="0"
          stroke="var(--chart-2)"
          strokeWidth={1.5}
        />
      </pattern>
      <pattern
        id="cashFlowForecastNegativePattern"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
      >
        <rect
          width="6"
          height="6"
          fill="var(--destructive)"
          fillOpacity={0.18}
        />
        <line
          x1="0"
          y1="6"
          x2="6"
          y2="0"
          stroke="var(--destructive)"
          strokeWidth={1.5}
        />
      </pattern>
    </>
  )
}

// Series prevision : aire pointillee + bar a hachures diagonales (pattern fill).
// Le bar utilise un xAxisId="forecast" dedie : sans ca il serait groupe avec
// cashFlow Bar sur le meme xAxis, decalant le bar primaire a chaque tick.
function CombinedForecastSeries({
  forecastFlow,
}: {
  forecastFlow: Array<{ key: string; value: number }>
}) {
  return (
    <>
      <Area
        yAxisId="balance"
        type="monotone"
        dataKey="cashBalanceForecast"
        stroke="var(--color-cashBalance)"
        fill="url(#cashBalanceForecastCombinedGradient)"
        strokeWidth={2.5}
        strokeDasharray="6 4"
        dot={false}
        activeDot={{ r: 4 }}
        connectNulls={false}
      />
      <Bar
        xAxisId="forecast"
        yAxisId="flow"
        dataKey="cashFlowForecast"
        radius={[4, 4, 0, 0]}
        maxBarSize={28}
      >
        {forecastFlow.map(({ key, value }) => (
          <Cell
            key={key}
            fill={
              value >= 0
                ? "url(#cashFlowForecastPositivePattern)"
                : "url(#cashFlowForecastNegativePattern)"
            }
          />
        ))}
      </Bar>
    </>
  )
}

export function CashCombinedChart({
  monthly,
  comparison,
  projection,
  className,
}: {
  monthly: MonthlyPoint[]
  // Comparaison alignee par index (m1 primary <-> m1 compare), comme MonthlyBarChart.
  comparison?: MonthlyPoint[]
  // Point projete optionnel ajoute apres le dernier mois historique. Aire
  // pointillee + bar a hachures pour signaler "non confirme".
  projection?: CashProjectionCombinedPoint
  className?: string
}) {
  const hasComparison = Boolean(comparison && comparison.length > 0)
  const { data, primaryFlow, comparisonFlow, forecastFlow } =
    buildCombinedChartData(monthly, comparison, projection)

  return (
    <ChartContainer config={combinedConfig} className={className}>
      <ComposedChart data={data}>
        <defs>
          <CombinedBalanceGradients />
          {projection ? <CombinedForecastBarPatterns /> : null}
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="monthLabel"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={20}
        />
        {projection ? (
          <XAxis dataKey="monthLabel" xAxisId="forecast" hide />
        ) : null}
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
        {hasComparison ? (
          <CombinedComparisonSeries comparisonFlow={comparisonFlow} />
        ) : null}
        <Area
          yAxisId="balance"
          type="monotone"
          dataKey="cashBalance"
          stroke="var(--color-cashBalance)"
          fill="url(#cashBalanceCombinedGradient)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Bar
          yAxisId="flow"
          dataKey="cashFlow"
          radius={[4, 4, 0, 0]}
          maxBarSize={28}
          fill="var(--chart-2)"
          fillOpacity={0.65}
        >
          {flowCells(primaryFlow, "var(--chart-2)", "var(--destructive)")}
        </Bar>
        {projection ? (
          <CombinedForecastSeries forecastFlow={forecastFlow} />
        ) : null}
      </ComposedChart>
    </ChartContainer>
  )
}
