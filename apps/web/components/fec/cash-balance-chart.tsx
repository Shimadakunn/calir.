"use client"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  formatEuroAxis,
  tooltipFormatter,
} from "@/components/fec/cash-chart-helpers"
import type { MonthlyPoint } from "@/lib/fec/analytics"

const balanceConfig = {
  cashBalance: { label: "Solde", color: "var(--chart-3)" },
  cashBalanceForecast: { label: "Prévisionnel", color: "var(--chart-3)" },
} satisfies ChartConfig

interface CashProjectionPoint {
  label: string
  value: number
}

interface BalanceDatum {
  monthLabel: string
  cashBalance: number | null
  cashBalanceForecast: number | null
}

// Construit le dataset etendu : on duplique la valeur du dernier mois
// historique sur la cle `cashBalanceForecast` pour que les deux <Area> se
// touchent visuellement (point pont). Sans ce pont, recharts dessine deux
// segments deconnectes par un trou.
function buildBalanceData(
  monthly: MonthlyPoint[],
  projection: CashProjectionPoint | undefined
): BalanceDatum[] {
  if (!projection)
    return monthly.map((m) => ({
      monthLabel: m.monthLabel,
      cashBalance: m.cashBalance,
      cashBalanceForecast: null,
    }))
  return [
    ...monthly.map((m, i) => ({
      monthLabel: m.monthLabel,
      cashBalance: m.cashBalance,
      cashBalanceForecast: i === monthly.length - 1 ? m.cashBalance : null,
    })),
    {
      monthLabel: projection.label,
      cashBalance: null,
      cashBalanceForecast: projection.value,
    },
  ]
}

export function CashBalanceChart({
  monthly,
  projection,
  className,
}: {
  monthly: MonthlyPoint[]
  // Point projete optionnel ajoute apres le dernier mois historique, en
  // pointille — convention forecast standard. Le label sert de tick X.
  projection?: CashProjectionPoint
  className?: string
}) {
  const data = buildBalanceData(monthly, projection)
  return (
    <ChartContainer config={balanceConfig} className={className}>
      <AreaChart data={data}>
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
          <linearGradient
            id="cashBalanceForecastGradient"
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
          connectNulls={false}
        />
        {projection ? (
          <Area
            type="monotone"
            dataKey="cashBalanceForecast"
            stroke="var(--color-cashBalance)"
            fill="url(#cashBalanceForecastGradient)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            activeDot={{ r: 4 }}
            connectNulls={false}
          />
        ) : null}
      </AreaChart>
    </ChartContainer>
  )
}
