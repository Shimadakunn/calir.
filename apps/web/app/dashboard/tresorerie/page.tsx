"use client"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  Banknote,
  CalendarClock,
  Landmark,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { useState } from "react"

import { CashCombinedChart } from "@/components/fec/cash-balance-chart"
import { ComparisonToggle } from "@/components/fec/comparison-toggle"
import { DashboardEmptyState } from "@/components/fec/empty-state"
import {
  FormattedCurrency,
  FormattedNumber,
} from "@/components/fec/formatted-number"
import { KpiCard } from "@/components/fec/kpi-card"
import { TopList } from "@/components/fec/top-list"
import { useFecStore } from "@/lib/fec/store"

export default function TresoreriePage() {
  const { data, comparisonData } = useFecStore()
  const [showComparison, setShowComparison] = useState(true)
  if (!data) return <DashboardEmptyState />

  const { kpi, monthly, cashByAccount } = data

  // Solde min et max sur la periode
  const balances = monthly.map((m) => m.cashBalance)
  const minBalance = balances.length > 0 ? Math.min(...balances) : 0
  const maxBalance = balances.length > 0 ? Math.max(...balances) : 0

  // DSO / DPO approximatifs : creances / CA * 365
  const monthsCovered = data.period.monthsCovered
  const annualizedRevenue =
    monthsCovered > 0 ? (kpi.revenue / monthsCovered) * 12 : kpi.revenue
  const annualizedExpenses =
    monthsCovered > 0 ? (kpi.expenses / monthsCovered) * 12 : kpi.expenses
  const dso =
    annualizedRevenue > 0
      ? (kpi.customerReceivables / annualizedRevenue) * 365
      : 0
  const dpo =
    annualizedExpenses > 0
      ? (kpi.supplierPayables / annualizedExpenses) * 365
      : 0

  // Mois deficitaires en cash flow
  const negativeMonths = monthly.filter((m) => m.cashFlow < 0).length

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Trésorerie
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Solde, flux et délais de paiement — votre marge de manœuvre au
          quotidien
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Solde actuel"
          value={<FormattedCurrency value={kpi.cashBalance} />}
          icon={Banknote}
          tone={
            kpi.cashBalance < 0
              ? "danger"
              : kpi.cashBalance < kpi.revenue * 0.05
                ? "warning"
                : "success"
          }
          hint="Cumul fin de période"
        />
        <KpiCard
          label="Solde min."
          value={<FormattedCurrency value={minBalance} />}
          icon={TrendingDown}
          hint="Point bas atteint"
          tone={minBalance < 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Solde max."
          value={<FormattedCurrency value={maxBalance} />}
          icon={TrendingUp}
          hint="Point haut atteint"
        />
        <KpiCard
          label="Mois en flux négatif"
          value={
            <>
              <FormattedNumber value={negativeMonths} /> /{" "}
              <FormattedNumber value={monthly.length} />
            </>
          }
          icon={CalendarClock}
          hint="Sorties > entrées"
          tone={negativeMonths > monthly.length / 2 ? "warning" : "default"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Évolution de la trésorerie</CardTitle>
          <CardDescription>
            Solde cumulé fin de mois (aire) et flux net mensuel (barres)
          </CardDescription>
          {comparisonData ? (
            <CardAction>
              <ComparisonToggle
                active={showComparison}
                onToggle={() => setShowComparison((v) => !v)}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <CashCombinedChart
            monthly={monthly}
            comparison={
              showComparison && comparisonData
                ? comparisonData.monthly
                : undefined
            }
            className="h-[360px] w-full"
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Délais de paiement</CardTitle>
            <CardDescription>
              Combien de jours avant que l'argent arrive (ou parte)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  DSO · Vous payent vos clients
                </p>
                <p className="font-heading text-2xl font-bold tabular-nums">
                  <FormattedNumber value={dso} />{" "}
                  <span className="text-sm text-muted-foreground">jours</span>
                </p>
              </div>
              <Separator />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {dso > 60
                  ? `Vos clients mettent en moyenne ${dso.toFixed(0)} jours à régler. Au-dessus de 60 jours, c'est tendu : mettez en place des relances automatiques (J+15, J+30, J+45).`
                  : dso > 45
                    ? `Délai correct mais améliorable. Visez 30 jours avec des relances automatiques.`
                    : "Délai sain. Vos clients règlent rapidement."}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  DPO · Vous payez vos fournisseurs
                </p>
                <p className="font-heading text-2xl font-bold tabular-nums">
                  <FormattedNumber value={dpo} />{" "}
                  <span className="text-sm text-muted-foreground">jours</span>
                </p>
              </div>
              <Separator />
              <p className="text-xs leading-relaxed text-muted-foreground">
                {dpo < 30
                  ? `Vous payez vite. Vous pouvez essayer de négocier 45-60 jours pour soulager votre trésorerie.`
                  : dpo > 60
                    ? `Vous payez tard. Attention au risque de litige et aux pénalités de retard légales (loi LME).`
                    : "Délai standard. Bon équilibre entre relation fournisseur et trésorerie."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comptes bancaires</CardTitle>
            <CardDescription>
              Soldes par compte (banques + caisses)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cashByAccount.length > 0 ? (
              <TopList
                items={cashByAccount}
                emptyLabel="Aucun compte de trésorerie identifié"
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                <Landmark className="mr-2 size-4" />
                Aucun compte de trésorerie identifié
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
