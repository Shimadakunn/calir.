"use client"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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

export function CashBalanceChart({
  monthly,
  className,
}: {
  monthly: MonthlyPoint[]
  className?: string
}) {
  return (
    <ChartContainer config={balanceConfig} className={className}>
      <LineChart data={monthly}>
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
        <Line
          type="monotone"
          dataKey="cashBalance"
          stroke="var(--color-cashBalance)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
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
