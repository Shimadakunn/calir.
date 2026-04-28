"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import {
  FormattedCurrency,
  FormattedNumber,
} from "@/components/fec/formatted-number"
import type { TopCounterparty } from "@/lib/fec/analytics"
import { formatShortDate } from "@/lib/fec/format"

export function CounterpartyTable({
  items,
  total,
  amountLabel = "Montant",
}: {
  items: TopCounterparty[]
  total: number
  amountLabel?: string
}) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune donnée à afficher
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">#</TableHead>
            <TableHead>Compte</TableHead>
            <TableHead className="hidden md:table-cell">Numéro</TableHead>
            <TableHead className="hidden md:table-cell">Écritures</TableHead>
            <TableHead className="hidden lg:table-cell">
              Dernière écriture
            </TableHead>
            <TableHead className="text-right">{amountLabel}</TableHead>
            <TableHead className="text-right">Part</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((it, idx) => {
            const share = total > 0 ? (it.amount / total) * 100 : 0
            return (
              <TableRow key={it.accountNum}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {String(idx + 1).padStart(2, "0")}
                </TableCell>
                <TableCell className="font-medium">{it.label}</TableCell>
                <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                  {it.accountNum}
                </TableCell>
                <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                  <FormattedNumber value={it.entryCount} />
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                  {formatShortDate(it.lastDate)}
                </TableCell>
                <TableCell className="text-right font-mono font-medium tabular-nums">
                  <FormattedCurrency value={it.amount} />
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                  {share.toFixed(1)}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
