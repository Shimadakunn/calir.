"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { BreakevenChart } from "@/components/fec/breakeven-chart"
import { FormattedCurrency } from "@/components/fec/formatted-number"
import type { KpiSummary } from "@/lib/fec/analytics"
import { formatEuro, formatPercent } from "@/lib/fec/format"

interface BreakevenSectionProps {
  kpi: KpiSummary
}

export function BreakevenSection({ kpi }: BreakevenSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Seuil de rentabilité</CardTitle>
        <CardDescription>
          Le chiffre d'affaires minimum pour couvrir vos charges fixes —
          au-delà, chaque euro vendu contribue au résultat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {kpi.breakevenPoint > 0 ? (
          <BreakevenBody kpi={kpi} />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Seuil non calculable : marge sur coûts variables négative ou nulle (
            {formatEuro(kpi.contributionMargin)}).
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function BreakevenBody({ kpi }: { kpi: KpiSummary }) {
  return (
    <>
      <BreakevenChart
        revenue={kpi.revenue}
        breakevenPoint={kpi.breakevenPoint}
        className="w-full"
      />
      <div className="grid gap-3 border-t pt-3 sm:grid-cols-3">
        <Stat label="Charges fixes">
          <FormattedCurrency value={kpi.fixedCosts} />
        </Stat>
        <Stat label="Taux de marge sur coûts variables">
          {formatPercent(kpi.contributionMarginRate)}
        </Stat>
        <Stat
          label="Marge de sécurité"
          tone={kpi.safetyMargin >= 0 ? "default" : "danger"}
        >
          <FormattedCurrency value={kpi.safetyMargin} /> ·{" "}
          {formatPercent(kpi.safetyMarginRate)}
        </Stat>
      </div>
    </>
  )
}

function Stat({
  label,
  tone = "default",
  children,
}: {
  label: string
  tone?: "default" | "danger"
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`font-mono text-sm font-medium ${
          tone === "danger" ? "text-destructive" : "text-foreground"
        }`}
      >
        {children}
      </p>
    </div>
  )
}
