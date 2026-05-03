"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useMemo } from "react"

import { FormattedCurrency } from "@/components/fec/formatted-number"
import type { CategoryBreakdown } from "@/lib/fec/analytics"

interface ResultBreakdownProps {
  revenueCategories: CategoryBreakdown[]
  expenseCategories: CategoryBreakdown[]
  revenue: number
  expenses: number
  netResult: number
  className?: string
}

interface BarSegment {
  key: string
  label: string
  amount: number
  shareOfTotal: number // % of bar width (= max(rev, exp))
  shareOfBucket: number // % of its own bucket
  fill: string
  isResultCap?: boolean
  isLossCap?: boolean
}

const MIN_INLINE_PCT = 8 // segments narrower than this hide their inline label

export function ResultBreakdown({
  revenueCategories,
  expenseCategories,
  revenue,
  expenses,
  netResult,
  className,
}: ResultBreakdownProps) {
  const baseTotal = Math.max(revenue, expenses)
  const isProfit = netResult >= 0

  const revenueSegments = useMemo<BarSegment[]>(() => {
    if (baseTotal <= 0) return []
    const segments: BarSegment[] = revenueCategories.map((c) => ({
      key: `rev-${c.key}`,
      label: c.label,
      amount: c.amount,
      shareOfTotal: (c.amount / baseTotal) * 100,
      shareOfBucket: c.share,
      fill: c.fill ?? "var(--revenue-3)",
    }))
    if (!isProfit) {
      // Loss : on ajoute un cap rouge a droite pour egaler la longueur des charges.
      const lossAmount = expenses - revenue
      segments.push({
        key: "rev-loss-cap",
        label: "Perte nette",
        amount: lossAmount,
        shareOfTotal: (lossAmount / baseTotal) * 100,
        shareOfBucket: revenue > 0 ? (lossAmount / revenue) * 100 : 100,
        fill: "var(--result-loss)",
        isLossCap: true,
      })
    }
    return segments
  }, [revenueCategories, revenue, expenses, baseTotal, isProfit])

  const expenseSegments = useMemo<BarSegment[]>(() => {
    if (baseTotal <= 0) return []
    const segments: BarSegment[] = expenseCategories.map((c) => ({
      key: `exp-${c.key}`,
      label: c.label,
      amount: c.amount,
      shareOfTotal: (c.amount / baseTotal) * 100,
      shareOfBucket: c.share,
      fill: c.fill ?? "var(--expense-3)",
    }))
    if (isProfit) {
      // Profit : cap vert a droite, qui represente le resultat net.
      segments.push({
        key: "exp-result-cap",
        label: "Résultat net",
        amount: netResult,
        shareOfTotal: (netResult / baseTotal) * 100,
        shareOfBucket: expenses > 0 ? (netResult / expenses) * 100 : 100,
        fill: "var(--result)",
        isResultCap: true,
      })
    }
    return segments
  }, [expenseCategories, expenses, netResult, baseTotal, isProfit])

  if (baseTotal <= 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Pas assez de données pour calculer le résultat.
      </p>
    )
  }

  return (
    <TooltipProvider>
      <div className={cn("space-y-4", className)}>
        <BarRow
          label="Produits"
          total={revenue}
          accent="text-[var(--revenue)]"
          segments={revenueSegments}
        />
        <BarRow
          label="Charges"
          total={expenses}
          accent="text-[var(--expense)]"
          segments={expenseSegments}
        />
      </div>
    </TooltipProvider>
  )
}

function BarRow({
  label,
  total,
  accent,
  segments,
}: {
  label: string
  total: number
  accent: string
  segments: BarSegment[]
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={cn(
            "text-xs font-semibold tracking-wide uppercase",
            accent
          )}
        >
          {label}
        </span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          <FormattedCurrency value={total} />
        </span>
      </div>
      <Bar segments={segments} />
    </div>
  )
}

function Bar({ segments }: { segments: BarSegment[] }) {
  return (
    <div
      className="flex h-20 w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/30"
      role="img"
      aria-label="Composition"
    >
      {segments.map((seg, idx) => (
        <Segment key={seg.key} segment={seg} isFirst={idx === 0} />
      ))}
    </div>
  )
}

function Segment({
  segment,
  isFirst,
}: {
  segment: BarSegment
  isFirst: boolean
}) {
  const isCap = segment.isResultCap || segment.isLossCap
  // Les caps (Resultat / Perte) doivent toujours etre etiquetes : c'est le
  // resume visuel du resultat, jamais reporte ailleurs dans la legende.
  const showInline = isCap || segment.shareOfTotal >= MIN_INLINE_PCT
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            style={{
              width: `${String(segment.shareOfTotal)}%`,
              background: segment.fill,
            }}
            className={cn(
              "flex min-w-0 cursor-default items-center justify-center px-2 text-center transition-all",
              !isFirst && "border-l-2 border-background/60"
            )}
          />
        }
      >
        {showInline ? (
          <span
            className={cn(
              "max-w-full truncate text-xs font-semibold whitespace-nowrap sm:text-sm",
              isCap
                ? "font-bold text-foreground"
                : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
            )}
          >
            {segment.label}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-semibold">{segment.label}</span>
          <span className="font-mono tabular-nums opacity-80">
            {segment.shareOfBucket.toFixed(1)}% ·{" "}
            <FormattedCurrency value={segment.amount} tooltip={false} />
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
