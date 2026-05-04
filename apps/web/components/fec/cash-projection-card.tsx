"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Wallet } from "lucide-react"

import { FormattedCurrency } from "@/components/fec/formatted-number"
import type { CashProjection } from "@/lib/fec/analytics"
import { formatShortDate } from "@/lib/fec/format"

interface CashProjectionCardProps {
  data: CashProjection
}

const TONE_CLASS: Record<"default" | "positive" | "negative", string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-500",
  negative: "text-destructive",
}

export function CashProjectionCard({ data }: CashProjectionCardProps) {
  const projectedDanger = data.projectedCash < 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>Détail des engagements à court terme</CardTitle>
            <CardDescription>
              Au {formatShortDate(data.asOf)} · composition du solde
              prévisionnel affiché dans le chart Trésorerie
            </CardDescription>
          </div>
          <Wallet className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-1.5 rounded-md border p-4">
          <CascadeRow label="Solde actuel" amount={data.currentCash} bold />
          <CascadeRow
            label="Fournisseurs échus"
            amount={data.overduePayables}
            op="sub"
            indent
            tone="negative"
          />
          <CascadeRow
            label="TVA à décaisser"
            amount={data.vatPayable}
            op="sub"
            indent
            tone="negative"
          />
          <CascadeRow
            label="Salaires nets dus"
            amount={data.salariesPayable}
            op="sub"
            indent
            tone="negative"
          />
          <CascadeRow
            label="Charges sociales (URSSAF, mutuelle, retraite)"
            amount={data.socialChargesPayable}
            op="sub"
            indent
            tone="negative"
          />
          <CascadeRow
            label="Clients échus"
            amount={data.overdueReceivables}
            op="add"
            indent
            tone="positive"
          />
          <div className="my-1.5 border-t" />
          <CascadeRow
            label="Solde prévisionnel"
            amount={data.projectedCash}
            bold
            tone={projectedDanger ? "negative" : "default"}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function CascadeRow({
  label,
  amount,
  op = "none",
  indent = false,
  bold = false,
  tone = "default",
}: {
  label: string
  amount: number
  op?: "add" | "sub" | "none"
  indent?: boolean
  bold?: boolean
  tone?: "default" | "positive" | "negative"
}) {
  const operator = op === "add" ? "+ " : op === "sub" ? "− " : ""
  // A zero engagement isn't positive or negative — neutralise the colour so
  // "− 0 €" doesn't read as a danger.
  const effectiveTone = amount === 0 ? "default" : tone
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          indent ? "pl-4 text-muted-foreground" : "font-medium"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono tabular-nums",
          bold ? "font-semibold" : "font-medium",
          TONE_CLASS[effectiveTone]
        )}
      >
        {operator}
        <FormattedCurrency value={amount} />
      </span>
    </div>
  )
}
