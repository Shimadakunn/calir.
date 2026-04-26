"use client"

import type { CategoryBreakdown } from "@/lib/fec/analytics"
import { formatEuro } from "@/lib/fec/format"

export function CategoryBarList({ items }: { items: CategoryBreakdown[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune catégorie à afficher
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: item.fill }}
              />
              <span className="font-medium">{item.label}</span>
            </div>
            <div className="flex items-baseline gap-2 font-mono tabular-nums">
              <span className="font-semibold">{formatEuro(item.amount)}</span>
              <span className="text-xs text-muted-foreground">
                {item.share.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${String(item.share)}%`, background: item.fill }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
