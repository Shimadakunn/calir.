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
  ArrowRight,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

import { CashBalanceChart } from "@/components/fec/cash-balance-chart"
import { CategoryDonutChart } from "@/components/fec/category-donut-chart"
import { DashboardEmptyState } from "@/components/fec/empty-state"
import {
  FormattedCurrency,
  FormattedNumber,
} from "@/components/fec/formatted-number"
import { InsightCard } from "@/components/fec/insight-card"
import { KpiCard } from "@/components/fec/kpi-card"
import { MonthlyTrendChart } from "@/components/fec/monthly-trend-chart"
import { TopList } from "@/components/fec/top-list"
import { formatPercent } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

function DashboardOverview() {
  const { data } = useFecStore()

  if (!data) return <DashboardEmptyState />

  const {
    kpi,
    monthly,
    expenseCategories,
    topCustomers,
    topSuppliers,
    insights,
  } = data

  // Calcul du delta CA derniers 3 mois vs 3 precedents
  const last3Revenue = monthly.slice(-3).reduce((s, m) => s + m.revenue, 0)
  const prev3Revenue = monthly.slice(-6, -3).reduce((s, m) => s + m.revenue, 0)
  const revenueGrowth =
    prev3Revenue > 0 ? ((last3Revenue - prev3Revenue) / prev3Revenue) * 100 : 0

  const lastMonth = monthly.at(-1)
  const cashTone =
    kpi.cashBalance < 0
      ? "danger"
      : kpi.cashBalance < kpi.revenue * 0.05
        ? "warning"
        : "default"
  const marginTone =
    kpi.margin < 0 ? "danger" : kpi.margin < 5 ? "warning" : "success"

  // Insights : on prend les 3 plus prioritaires (critical > warning > info > positive)
  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
    positive: 3,
  }
  const topInsights = [...insights]
    .sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
    )
    .slice(0, 3)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Vue d'ensemble
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          La santé de votre entreprise sur la période ·{" "}
          <FormattedNumber value={data.period.monthsCovered} /> mois analysés ·{" "}
          <FormattedNumber value={data.meta.rowCount} /> écritures
        </p>
      </header>

      {/* === KPI principaux === */}
      <section>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Chiffre d'affaires"
            value={<FormattedCurrency value={kpi.revenue} />}
            icon={CircleDollarSign}
            trend={
              monthly.length >= 6
                ? {
                    direction:
                      revenueGrowth > 0
                        ? "up"
                        : revenueGrowth < 0
                          ? "down"
                          : "neutral",
                    text: `${revenueGrowth > 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`,
                    tone:
                      revenueGrowth > 0
                        ? "positive"
                        : revenueGrowth < -3
                          ? "negative"
                          : "neutral",
                  }
                : undefined
            }
            hint="3 derniers mois vs précédents"
          />
          <KpiCard
            label="Charges totales"
            value={<FormattedCurrency value={kpi.expenses} />}
            icon={ReceiptText}
            hint={`${(kpi.revenue > 0 ? (kpi.expenses / kpi.revenue) * 100 : 0).toFixed(0)}% du CA`}
          />
          <KpiCard
            label="Résultat net"
            value={<FormattedCurrency value={kpi.netResult} />}
            icon={TrendingUp}
            tone={marginTone}
            hint={`Marge ${formatPercent(kpi.margin)}`}
          />
          <KpiCard
            label="Trésorerie"
            value={<FormattedCurrency value={kpi.cashBalance} />}
            icon={Wallet}
            tone={cashTone}
            hint={lastMonth ? `Solde fin ${lastMonth.monthLabel}` : undefined}
          />
        </div>

        {/* KPI secondaires en 3 colonnes */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <KpiCard
            label="Marge brute"
            value={<FormattedCurrency value={kpi.grossMargin} />}
            hint={`${formatPercent(kpi.grossMarginRate)} du CA`}
            icon={PiggyBank}
          />
          <KpiCard
            label="Excédent brut d'exploitation"
            value={<FormattedCurrency value={kpi.ebe} />}
            hint="CA - achats - charges externes - personnel - impôts"
          />
          <KpiCard
            label="Créances vs dettes"
            value={
              <FormattedCurrency
                value={kpi.customerReceivables - kpi.supplierPayables}
              />
            }
            hint={
              <>
                Clients <FormattedCurrency value={kpi.customerReceivables} /> ·
                Fournisseurs <FormattedCurrency value={kpi.supplierPayables} />
              </>
            }
          />
        </div>
      </section>

      {/* === Insights actionnables === */}
      {topInsights.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">
                À votre attention
              </h2>
              <p className="text-sm text-muted-foreground">
                <FormattedNumber value={topInsights.length} /> action(s)
                prioritaire(s) parmi <FormattedNumber value={insights.length} />{" "}
                identifiées
              </p>
            </div>
            {insights.length > 3 ? (
              <Button
                variant="outline"
                size="sm"
                render={<Link href="/dashboard/insights" />}
              >
                Toutes les actions
                <ArrowRight />
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {topInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      ) : null}

      {/* === Tendance mensuelle === */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenus vs charges</CardTitle>
            <CardDescription>
              Évolution mensuelle sur la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart monthly={monthly} className="h-[280px] w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Trésorerie</CardTitle>
                <CardDescription>Solde fin de mois</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/tresorerie" />}
              >
                Détail
                <ArrowRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CashBalanceChart monthly={monthly} className="h-[280px] w-full" />
          </CardContent>
        </Card>
      </section>

      {/* === Charges + clients === */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Répartition des charges</CardTitle>
                <CardDescription>Où part votre argent</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/charges" />}
              >
                Détail
                <ArrowRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-[1fr_1fr] sm:items-center">
                <CategoryDonutChart
                  data={expenseCategories}
                  total={kpi.expenses}
                  centerLabel="charges"
                  className="h-[220px] w-full"
                />
                <div className="space-y-2">
                  {expenseCategories.slice(0, 5).map((cat) => (
                    <div
                      key={cat.key}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: cat.fill }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {cat.label}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {cat.share.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Pas de charges à afficher
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Top clients</CardTitle>
                <CardDescription>
                  Vos plus gros contributeurs au CA
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/clients" />}
              >
                Détail
                <ArrowRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <TopList
              items={topCustomers}
              showCount={5}
              emptyLabel="Aucun client identifié"
            />
          </CardContent>
        </Card>
      </section>

      {/* === Top fournisseurs === */}
      <section>
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Top fournisseurs</CardTitle>
                <CardDescription>
                  Vos plus gros postes de dépense — leviers de négociation
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={<Link href="/dashboard/fournisseurs" />}
              >
                Détail
                <ArrowRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <TopList
              items={topSuppliers}
              showCount={5}
              emptyLabel="Aucun fournisseur identifié"
            />
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Si vos 3 plus gros fournisseurs représentent une part
                significative de vos achats, vous avez du poids pour négocier
                des conditions plus avantageuses.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>
                  • Demandez 3 devis concurrents pour les 2 plus gros postes
                </li>
                <li>• Négociez 5-10% de remise sur volume annuel</li>
                <li>
                  • Allongez les délais de paiement pour soulager la trésorerie
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default function DashboardOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60svh] items-center justify-center text-sm text-muted-foreground">
          Chargement…
        </div>
      }
    >
      <DashboardOverview />
    </Suspense>
  )
}
