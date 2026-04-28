"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CalendarClock, ChartLine, HandCoins, Truck } from "lucide-react"

import { CounterpartyTable } from "@/components/fec/counterparty-table"
import { DashboardEmptyState } from "@/components/fec/empty-state"
import {
  FormattedCurrency,
  FormattedNumber,
} from "@/components/fec/formatted-number"
import { KpiCard } from "@/components/fec/kpi-card"
import { formatPercent } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

export default function FournisseursPage() {
  const { data } = useFecStore()
  if (!data) return <DashboardEmptyState />

  const { kpi, topSuppliers } = data

  const totalSupplierVolume = topSuppliers.reduce((s, c) => s + c.amount, 0)
  const top1Share =
    topSuppliers.length > 0 && totalSupplierVolume > 0
      ? (topSuppliers[0]!.amount / totalSupplierVolume) * 100
      : 0

  const monthsCovered = data.period.monthsCovered
  const annualizedExpenses =
    monthsCovered > 0 ? (kpi.expenses / monthsCovered) * 12 : kpi.expenses
  const dpo =
    annualizedExpenses > 0
      ? (kpi.supplierPayables / annualizedExpenses) * 365
      : 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Fournisseurs
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Avec qui vous travaillez — et où sont vos meilleurs leviers de
          négociation
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Fournisseurs identifiés"
          value={<FormattedNumber value={topSuppliers.length} />}
          icon={Truck}
          hint="Comptes auxiliaires actifs"
        />
        <KpiCard
          label="Top fournisseur"
          value={formatPercent(top1Share)}
          icon={ChartLine}
          hint={topSuppliers[0]?.label ?? "—"}
        />
        <KpiCard
          label="Dettes fournisseurs"
          value={<FormattedCurrency value={kpi.supplierPayables} />}
          icon={HandCoins}
          hint="Solde à payer"
        />
        <KpiCard
          label="Délai paiement (DPO)"
          value={
            <>
              <FormattedNumber value={dpo} /> j
            </>
          }
          icon={CalendarClock}
          hint={
            dpo < 30
              ? "Vous payez vite"
              : dpo > 60
                ? "Risque de litige"
                : "Délai standard"
          }
        />
      </section>

      <Card className="bg-gradient-to-br from-primary/[0.04] to-transparent">
        <CardHeader>
          <CardTitle>Vos leviers de négociation</CardTitle>
          <CardDescription>
            Plus un fournisseur pèse, plus vous avez d'arguments pour négocier
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="font-heading text-sm font-bold text-primary">
              01 · Demander 3 devis
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pour vos 2-3 plus gros postes, sollicitez systématiquement la
              concurrence chaque année. Vous obtiendrez 5-15% de remise.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-heading text-sm font-bold text-primary">
              02 · Allonger les délais
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Passer de 30 à 60 jours sur vos plus gros fournisseurs vous
              redonne instantanément du cash. Négociable si vous payez
              régulièrement.
            </p>
          </div>
          <div className="space-y-2">
            <p className="font-heading text-sm font-bold text-primary">
              03 · Consolider
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Si plusieurs fournisseurs vous fournissent le même type de
              service, regroupez chez le moins cher. Volume = pouvoir de
              négociation.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord fournisseurs</CardTitle>
          <CardDescription>
            Trié par montant total facturé — les comptes auxiliaires (401xxx)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CounterpartyTable
            items={topSuppliers}
            total={totalSupplierVolume}
            amountLabel="Facturé"
          />
        </CardContent>
      </Card>
    </div>
  )
}
