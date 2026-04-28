"use client"

import { FormattedCurrency } from "@/components/fec/formatted-number"
import type { TopCounterparty } from "@/lib/fec/analytics"

interface TopListProps {
  items: TopCounterparty[]
  emptyLabel?: string
  unit?: string
  className?: string
  showCount?: number
}

export function TopList({ items, emptyLabel, unit, showCount }: TopListProps) {
  const displayed = showCount ? items.slice(0, showCount) : items
  const max = displayed.reduce((m, it) => Math.max(m, it.amount), 0)

  if (displayed.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        {emptyLabel ?? "Aucune donnée disponible"}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {displayed.map((item) => {
        const percent = max > 0 ? (item.amount / max) * 100 : 0
        return (
          <div key={item.accountNum} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {item.accountNum}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-semibold tabular-nums">
                  <FormattedCurrency value={item.amount} />
                </p>
                {unit ? (
                  <p className="text-[10px] text-muted-foreground">{unit}</p>
                ) : null}
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${String(percent)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
