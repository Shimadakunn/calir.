"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { FormattedCurrency } from "@/components/fec/formatted-number"
import type { CategoryBreakdown } from "@/lib/fec/analytics"

export function CategoryTable({ items }: { items: CategoryBreakdown[] }) {
  if (items.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Aucune catégorie à afficher
      </p>
    )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>Catégorie</TableHead>
            <TableHead className="text-right">Montant</TableHead>
            <TableHead className="w-20 text-right">Part</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.key}>
              <TableCell>
                <span
                  aria-hidden
                  className="block size-2.5 shrink-0 rounded-full"
                  style={{ background: item.fill }}
                />
              </TableCell>
              <TableCell className="font-medium">{item.label}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                <FormattedCurrency value={item.amount} />
              </TableCell>
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {item.share.toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
