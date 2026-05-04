// Helpers partages par CashBalanceChart et CashCombinedChart : axe Y formate
// en euros compacts + tooltip rendant la valeur exacte avec le label de serie.

import { formatEuroCompact, formatEuroExact } from "@/lib/fec/format"

export function formatEuroAxis(value: number): string {
  return formatEuroCompact(value)
}

export function tooltipFormatter(value: unknown, name: unknown) {
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
