"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowRight, ReceiptText, Users } from "lucide-react"
import Link from "next/link"

import { FormattedCurrency } from "@/components/fec/formatted-number"
import type { AgedBalance, AgedBalanceBucket } from "@/lib/fec/analytics"
import {
  formatEuro,
  formatEuroCompact,
  formatShortDate,
} from "@/lib/fec/format"

type PartyType = "clients" | "fournisseurs"

interface AgedBalanceCardProps {
  type: PartyType
  data: AgedBalance
  compact?: boolean
}

const BUCKET_COLOR: Record<AgedBalanceBucket["key"], string> = {
  notDue: "var(--bar-neutral)",
  "0_30": "var(--expense-1)",
  "31_60": "var(--expense-3)",
  "60plus": "var(--expense-5)",
}

const MIN_INLINE_PCT = 8

function pluralize(n: number, singular: string, plural?: string): string {
  return n > 1 ? (plural ?? `${singular}s`) : singular
}

function formatDaysOverdue(days: number): string {
  if (days < 0) return `Échéance dans ${String(-days)} j`
  if (days === 0) return "Échéance aujourd'hui"
  return `${String(days)} j de retard`
}

export function AgedBalanceCard({
  type,
  data,
  compact = false,
}: AgedBalanceCardProps) {
  const isClients = type === "clients"
  const partyWord = isClients ? "client" : "fournisseur"
  const Icon = isClients ? Users : ReceiptText
  const title = isClients ? "Balance âgée clients" : "Balance âgée fournisseurs"
  const overdueLabel = isClients ? "À relancer" : "À payer en priorité"
  const emptyLabel = isClients
    ? "Aucun retard de paiement client."
    : "Aucune facture fournisseur en retard."
  const detailHref = isClients
    ? "/dashboard/clients"
    : "/dashboard/fournisseurs"

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Au {formatShortDate(data.asOf)} · échéance {data.paymentDays} j ·{" "}
              {data.partyCount} {pluralize(data.partyCount, partyWord)} avec
              encours
            </CardDescription>
          </div>
          {compact ? (
            <Button
              variant="ghost"
              size="sm"
              render={<Link href={detailHref} />}
            >
              Détail
              <ArrowRight />
            </Button>
          ) : (
            <Icon className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col space-y-4">
        {/* Tuiles non echu / echu */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1 rounded-md border p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Non échu
            </p>
            <p className="font-heading text-2xl font-bold tabular-nums">
              {formatEuroCompact(data.notDueAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.notDueInvoiceCount}{" "}
              {pluralize(data.notDueInvoiceCount, "facture")} ·{" "}
              {data.notDuePartyCount}{" "}
              {pluralize(data.notDuePartyCount, partyWord)}
            </p>
          </div>
          <div className="space-y-1 rounded-md border border-destructive/30 bg-destructive/[0.04] p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Échu
            </p>
            <p className="font-heading text-2xl font-bold text-destructive tabular-nums">
              {formatEuroCompact(data.overdueAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.overdueInvoiceCount}{" "}
              {pluralize(data.overdueInvoiceCount, "facture")} ·{" "}
              {data.overduePartyCount}{" "}
              {pluralize(data.overduePartyCount, partyWord)}
            </p>
          </div>
        </div>

        {/* Barre stackee par tranche d'aging */}
        <AgingBar buckets={data.buckets} totalAmount={data.totalAmount} />

        {/* Top a relancer / payer — masque en mode compact (page /dashboard) */}
        {!compact && (
          <OverdueList
            parties={data.topOverdueParties}
            label={overdueLabel}
            emptyLabel={emptyLabel}
          />
        )}
      </CardContent>
    </Card>
  )
}

function OverdueList({
  parties,
  label,
  emptyLabel,
}: {
  parties: AgedBalance["topOverdueParties"]
  label: string
  emptyLabel: string
}) {
  return (
    <div className="flex-1 space-y-2">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {parties.length > 0 ? (
        <ul className="space-y-1.5">
          {parties.map((p) => (
            <li
              key={p.accountNum}
              className="flex items-baseline justify-between gap-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate" title={p.label}>
                {p.label}
              </span>
              <span
                className="font-mono font-medium tabular-nums"
                title={formatEuro(p.overdueAmount)}
              >
                {formatEuroCompact(p.overdueAmount)}
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {formatDaysOverdue(p.oldestDaysOverdue)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  )
}

function AgingBar({
  buckets,
  totalAmount,
}: {
  buckets: AgedBalanceBucket[]
  totalAmount: number
}) {
  if (totalAmount <= 0)
    return (
      <p className="text-xs text-muted-foreground">
        Aucun encours sur la période.
      </p>
    )

  const visibleBuckets = buckets.filter((b) => b.amount > 0)

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Encours total
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums">
            <FormattedCurrency value={totalAmount} />
          </span>
        </div>
        <div
          className="flex h-20 w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/30"
          role="img"
          aria-label="Répartition par tranche d'âge"
        >
          {visibleBuckets.map((b, idx) => (
            <AgingSegment
              key={b.key}
              bucket={b}
              totalAmount={totalAmount}
              isFirst={idx === 0}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}

function AgingSegment({
  bucket,
  totalAmount,
  isFirst,
}: {
  bucket: AgedBalanceBucket
  totalAmount: number
  isFirst: boolean
}) {
  const sharePct = (bucket.amount / totalAmount) * 100
  const showInline = sharePct >= MIN_INLINE_PCT

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            style={{
              width: `${String(sharePct)}%`,
              background: BUCKET_COLOR[bucket.key],
            }}
            className={cn(
              "flex min-w-0 cursor-default items-center justify-center px-2 text-center transition-all",
              !isFirst && "border-l-2 border-background/60"
            )}
          />
        }
      >
        {showInline ? (
          <span className="max-w-full truncate text-xs font-semibold whitespace-nowrap text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] sm:text-sm">
            {bucket.label}
          </span>
        ) : null}
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex flex-col gap-0.5 text-xs">
          <span className="font-semibold">{bucket.label}</span>
          <span className="font-mono tabular-nums opacity-80">
            <FormattedCurrency value={bucket.amount} tooltip={false} /> ·{" "}
            {bucket.count} {pluralize(bucket.count, "facture")} ·{" "}
            {sharePct.toFixed(1)}%
          </span>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
