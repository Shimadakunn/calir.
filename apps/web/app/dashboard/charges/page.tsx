"use client"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Briefcase, Building2, Receipt, ReceiptText } from "lucide-react"
import { useState } from "react"

import { CategoryBarList } from "@/components/fec/category-bar-list"
import { CategoryDonutChart } from "@/components/fec/category-donut-chart"
import { CategoryTable } from "@/components/fec/category-table"
import { ComparisonToggle } from "@/components/fec/comparison-toggle"
import { DashboardEmptyState } from "@/components/fec/empty-state"
import { FormattedCurrency } from "@/components/fec/formatted-number"
import { KpiCard } from "@/components/fec/kpi-card"
import { MonthlyBarChart } from "@/components/fec/monthly-bar-chart"
import { ResultBreakdown } from "@/components/fec/result-breakdown"
import { TopList } from "@/components/fec/top-list"
import { formatPercent } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

export default function ChargesPage() {
  const { data, comparisonData } = useFecStore()
  const [showComparison, setShowComparison] = useState(true)
  if (!data) return <DashboardEmptyState />

  const { kpi, monthly, expenseCategories, topExpenseAccounts } = data

  const expenseRatio = kpi.revenue > 0 ? (kpi.expenses / kpi.revenue) * 100 : 0
  const payrollRatio = kpi.revenue > 0 ? (kpi.payroll / kpi.revenue) * 100 : 0
  const externalRatio =
    kpi.revenue > 0 ? (kpi.externalCharges / kpi.revenue) * 100 : 0
  const monthlyAvgExpenses =
    monthly.length > 0 ? kpi.expenses / monthly.length : 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Charges
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Où part votre argent — et où vous pouvez agir
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Charges totales"
          value={<FormattedCurrency value={kpi.expenses} />}
          icon={ReceiptText}
          hint={`${expenseRatio.toFixed(0)}% du CA`}
        />
        <KpiCard
          label="Charges mensuelles moy."
          value={<FormattedCurrency value={monthlyAvgExpenses} />}
          icon={Receipt}
          hint="Moyenne sur la période"
        />
        <KpiCard
          label="Salaires + charges sociales"
          value={<FormattedCurrency value={kpi.payroll} />}
          icon={Briefcase}
          hint={`${formatPercent(payrollRatio)} du CA`}
          tone={payrollRatio > 60 ? "warning" : "default"}
        />
        <KpiCard
          label="Services extérieurs"
          value={<FormattedCurrency value={kpi.externalCharges} />}
          icon={Building2}
          hint={`${formatPercent(externalRatio)} du CA`}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Composition des charges</CardTitle>
          <CardDescription>
            La part de chaque catégorie comptable dans vos dépenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResultBreakdown
            variant="expenses"
            expenseCategories={expenseCategories}
            expenses={kpi.expenses}
          />
          <CategoryTable items={expenseCategories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution mensuelle des charges</CardTitle>
          <CardDescription>
            Identifiez les pics et les postes saisonniers à anticiper
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
          <MonthlyBarChart
            monthly={monthly}
            metric="expenses"
            comparison={
              showComparison && comparisonData
                ? comparisonData.monthly
                : undefined
            }
            className="h-[320px] w-full"
          />
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des charges</CardTitle>
            <CardDescription>Par grande catégorie comptable</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <CategoryDonutChart
                data={expenseCategories}
                total={kpi.expenses}
                centerLabel="charges"
                className="h-[280px] w-full"
              />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune charge à afficher
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détail par catégorie</CardTitle>
            <CardDescription>Trié du plus lourd au plus léger</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryBarList items={expenseCategories} />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Top postes de charges</CardTitle>
          <CardDescription>
            Les comptes spécifiques où vous dépensez le plus — vos leviers
            d'optimisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TopList
            items={topExpenseAccounts}
            showCount={10}
            emptyLabel="Aucune charge identifiée"
          />
        </CardContent>
      </Card>

      {expenseCategories.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Pistes d'optimisation</CardTitle>
            <CardDescription>
              Suggestions concrètes basées sur votre structure de charges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {payrollRatio > 60 ? (
              <div className="rounded-lg border-l-2 border-amber-500 bg-amber-500/5 p-3">
                <p className="font-medium">Charges de personnel élevées</p>
                <p className="mt-0.5 text-muted-foreground">
                  Plus de 60% du CA part en salaires et charges. Avant
                  d'envisager une réduction d'effectif, optimisez la
                  productivité (outils, processus) et vérifiez les aides à
                  l'embauche/formation.
                </p>
              </div>
            ) : null}
            {externalRatio > 30 ? (
              <div className="rounded-lg border-l-2 border-blue-500 bg-blue-500/5 p-3">
                <p className="font-medium">Services extérieurs importants</p>
                <p className="mt-0.5 text-muted-foreground">
                  Les loyers, télécom, énergie, sous-traitance pèsent{" "}
                  {externalRatio.toFixed(0)}% du CA. Renégociez ces contrats
                  annuellement, mettez les fournisseurs en concurrence.
                </p>
              </div>
            ) : null}
            {kpi.financialCharges > kpi.revenue * 0.02 ? (
              <div className="rounded-lg border-l-2 border-amber-500 bg-amber-500/5 p-3">
                <p className="font-medium">
                  Charges financières non négligeables
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Vos intérêts et frais bancaires représentent{" "}
                  {((kpi.financialCharges / kpi.revenue) * 100).toFixed(1)}% du
                  CA. Comparez les conditions de votre banque, renégociez les
                  taux ou consolidez les emprunts.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
