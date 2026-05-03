"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { FormattedCurrency } from "@/components/fec/formatted-number"
import { formatEuroCompact } from "@/lib/fec/format"

interface BreakevenChartProps {
  revenue: number
  breakevenPoint: number
  className?: string
}

export function BreakevenChart({
  revenue,
  breakevenPoint,
  className,
}: BreakevenChartProps) {
  const isAbove = revenue >= breakevenPoint
  const scaleMax = Math.max(revenue, breakevenPoint, 1)
  const breakevenLeft = (breakevenPoint / scaleMax) * 100
  const revenueWidth = (revenue / scaleMax) * 100

  const revenueClass = isAbove
    ? "bg-[var(--result)]"
    : "bg-[var(--result-loss)]"

  return (
    <div
      aria-label={`Chiffre d'affaires ${formatEuroCompact(revenue)} comparé au seuil de rentabilité ${formatEuroCompact(breakevenPoint)}`}
      className={cn("space-y-3", className)}
      role="img"
    >
      <div className="relative h-10 w-full">
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className="absolute inset-y-0 left-0 cursor-default bg-muted-foreground/30"
                style={{ width: `${String(breakevenLeft)}%` }}
              />
            }
          />
          <TooltipContent>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Seuil de rentabilité</span>
              <span className="font-mono opacity-80">
                <FormattedCurrency value={breakevenPoint} tooltip={false} />
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <div
                className={cn(
                  "absolute top-1/2 left-0 h-5 -translate-y-1/2 cursor-default transition-all",
                  revenueClass
                )}
                style={{ width: `${String(revenueWidth)}%` }}
              />
            }
          />
          <TooltipContent>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">Chiffre d'affaires</span>
              <span className="font-mono opacity-80">
                <FormattedCurrency value={revenue} tooltip={false} />
              </span>
            </div>
          </TooltipContent>
        </Tooltip>
        <div
          className="pointer-events-none absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${String(breakevenLeft)}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-sm", revenueClass)} />
          <span className="text-muted-foreground">Chiffre d'affaires</span>
          <span className="font-mono font-medium">
            <FormattedCurrency value={revenue} />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-muted-foreground/30" />
          <span className="text-muted-foreground">Seuil de rentabilité</span>
          <span className="font-mono font-medium">
            <FormattedCurrency value={breakevenPoint} />
          </span>
        </div>
      </div>
    </div>
  )
}
