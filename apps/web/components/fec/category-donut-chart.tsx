"use client"

import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"

import type { CategoryBreakdown } from "@/lib/fec/analytics"
import { formatEuroCompact } from "@/lib/fec/format"

interface CategoryDonutChartProps {
  data: CategoryBreakdown[]
  total: number
  centerLabel?: string
  className?: string
}

function tooltipFormatter(value: unknown, name: unknown) {
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value)
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <span className="text-muted-foreground">{String(name ?? "")}</span>
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

export function CategoryDonutChart({
  data,
  total,
  centerLabel,
  className,
}: CategoryDonutChartProps) {
  const config = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {}
    for (const item of data) {
      cfg[item.label] = {
        label: item.label,
        color: item.fill ?? "var(--chart-1)",
      }
    }
    return cfg
  }, [data])

  return (
    <ChartContainer config={config} className={className}>
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent hideLabel formatter={tooltipFormatter} />
          }
        />
        <Pie
          data={data}
          dataKey="amount"
          nameKey="label"
          innerRadius={60}
          outerRadius={90}
          strokeWidth={2}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
          {centerLabel ? (
            <Label
              content={(props) => {
                const viewBox = props.viewBox as
                  | { cx?: number; cy?: number }
                  | undefined
                if (
                  !viewBox ||
                  viewBox.cx === undefined ||
                  viewBox.cy === undefined
                ) {
                  return null
                }
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy - 6}
                      className="fill-foreground font-heading text-xl font-bold"
                    >
                      {formatEuroCompact(total)}
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={viewBox.cy + 14}
                      className="fill-muted-foreground text-xs"
                    >
                      {centerLabel}
                    </tspan>
                  </text>
                )
              }}
            />
          ) : null}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
