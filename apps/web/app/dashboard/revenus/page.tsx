"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CircleDollarSign, TrendingUp, Users } from "lucide-react"

import { CategoryBarList } from "@/components/fec/category-bar-list"
import { CategoryDonutChart } from "@/components/fec/category-donut-chart"
import { DashboardEmptyState } from "@/components/fec/empty-state"
import {
  FormattedCurrency,
  FormattedNumber,
} from "@/components/fec/formatted-number"
import { KpiCard } from "@/components/fec/kpi-card"
import { MonthlyBarChart } from "@/components/fec/monthly-bar-chart"
import { TopList } from "@/components/fec/top-list"
import { formatPercent } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

export default function RevenusPage() {
  const { data } = useFecStore()
  if (!data) return <DashboardEmptyState />

  const { kpi, monthly, revenueCategories, topCustomers, topRevenueAccounts } =
    data

  // Calcul ratio CA / customer concentration
  const top1ClientShare =
    topCustomers.length > 0 && kpi.revenue > 0
      ? (topCustomers[0]!.amount / kpi.revenue) * 100
      : 0
  const top3ClientShare =
    topCustomers.length >= 3 && kpi.revenue > 0
      ? (topCustomers.slice(0, 3).reduce((s, c) => s + c.amount, 0) /
          kpi.revenue) *
        100
      : 0

  // Croissance derniers 3 mois vs 3 precedents
  const last3 = monthly.slice(-3).reduce((s, m) => s + m.revenue, 0)
  const prev3 = monthly.slice(-6, -3).reduce((s, m) => s + m.revenue, 0)
  const growth = prev3 > 0 ? ((last3 - prev3) / prev3) * 100 : 0
  const monthlyAvg = monthly.length > 0 ? kpi.revenue / monthly.length : 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Revenus
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          D'où vient votre chiffre d'affaires et comment il évolue
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chiffre d'affaires"
          value={<FormattedCurrency value={kpi.revenue} />}
          icon={CircleDollarSign}
          hint={
            <>
              Sur <FormattedNumber value={monthly.length} /> mois
            </>
          }
        />
        <KpiCard
          label="CA mensuel moyen"
          value={<FormattedCurrency value={monthlyAvg} />}
          icon={TrendingUp}
          hint="Moyenne sur la période"
        />
        <KpiCard
          label="Croissance 3 mois"
          value={`${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`}
          icon={TrendingUp}
          tone={growth > 0 ? "success" : growth < -5 ? "warning" : "default"}
          hint="3 derniers mois vs précédents"
        />
        <KpiCard
          label="Top 3 clients"
          value={formatPercent(top3ClientShare)}
          icon={Users}
          tone={top3ClientShare > 60 ? "warning" : "default"}
          hint={
            top3ClientShare > 60 ? "Forte concentration" : "Concentration saine"
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle du chiffre d'affaires</CardTitle>
          <CardDescription>
            Détectez tendances, saisonnalités et anomalies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyBarChart
            monthly={monthly}
            metric="revenue"
            className="h-[320px] w-full"
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sources de revenus</CardTitle>
            <CardDescription>
              Répartition par catégorie comptable (compte 7xx)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueCategories.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-[1fr_1fr] sm:items-center">
                <CategoryDonutChart
                  data={revenueCategories}
                  total={kpi.revenue}
                  centerLabel="revenus"
                  className="h-[240px] w-full"
                />
                <CategoryBarList items={revenueCategories} />
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune source de revenus identifiée
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comptes de produits</CardTitle>
            <CardDescription>
              Détail par compte du Plan Comptable Général
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopList
              items={topRevenueAccounts}
              showCount={10}
              emptyLabel="Aucun produit identifié"
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Top clients</CardTitle>
          <CardDescription>
            Les clients qui pèsent le plus dans votre chiffre d'affaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top1ClientShare > 30 ? (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/[0.05] p-3">
              <p className="text-sm font-medium">
                Attention : {topCustomers[0]?.label} représente{" "}
                {top1ClientShare.toFixed(0)}% de votre CA
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Si ce client part, votre activité chute mécaniquement de{" "}
                {top1ClientShare.toFixed(0)}%. Diversifiez votre portefeuille.
              </p>
            </div>
          ) : null}
          <TopList
            items={topCustomers}
            showCount={10}
            emptyLabel="Aucun client identifié"
          />
        </CardContent>
      </Card>
    </div>
  )
}
