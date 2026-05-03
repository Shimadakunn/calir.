"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CalendarClock, ChartLine, CircleAlert, Users } from "lucide-react"

import { AgedBalanceCard } from "@/components/fec/aged-balance-card"
import { CounterpartyTable } from "@/components/fec/counterparty-table"
import { DashboardEmptyState } from "@/components/fec/empty-state"
import {
  FormattedCurrency,
  FormattedNumber,
} from "@/components/fec/formatted-number"
import { KpiCard } from "@/components/fec/kpi-card"
import { formatPercent } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

export default function ClientsPage() {
  const { data } = useFecStore()
  if (!data) return <DashboardEmptyState />

  const { kpi, topCustomers, agedReceivables } = data

  const totalCustomerVolume = topCustomers.reduce((s, c) => s + c.amount, 0)
  const top1Share =
    topCustomers.length > 0 && totalCustomerVolume > 0
      ? (topCustomers[0]!.amount / totalCustomerVolume) * 100
      : 0
  const top3Share =
    topCustomers.length >= 3 && totalCustomerVolume > 0
      ? (topCustomers.slice(0, 3).reduce((s, c) => s + c.amount, 0) /
          totalCustomerVolume) *
        100
      : 0

  // DSO
  const monthsCovered = data.period.monthsCovered
  const annualizedRevenue =
    monthsCovered > 0 ? (kpi.revenue / monthsCovered) * 12 : kpi.revenue
  const dso =
    annualizedRevenue > 0
      ? (kpi.customerReceivables / annualizedRevenue) * 365
      : 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <header className="space-y-1">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Clients
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Qui paie votre entreprise — et à quelle hauteur êtes-vous dépendant
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Clients identifiés"
          value={<FormattedNumber value={topCustomers.length} />}
          icon={Users}
          hint="Comptes auxiliaires actifs"
        />
        <KpiCard
          label="Top client"
          value={formatPercent(top1Share)}
          icon={ChartLine}
          tone={top1Share > 35 ? "warning" : "default"}
          hint={topCustomers[0]?.label ?? "—"}
        />
        <KpiCard
          label="Top 3 clients"
          value={formatPercent(top3Share)}
          icon={ChartLine}
          tone={top3Share > 60 ? "warning" : "default"}
          hint={top3Share > 60 ? "Forte concentration" : "Concentration saine"}
        />
        <KpiCard
          label="Délai de paiement (DSO)"
          value={
            <>
              <FormattedNumber value={dso} /> j
            </>
          }
          icon={CalendarClock}
          tone={dso > 60 ? "warning" : "default"}
          hint={
            <>
              Créances : <FormattedCurrency value={kpi.customerReceivables} />
            </>
          }
        />
      </section>

      <AgedBalanceCard type="clients" data={agedReceivables} />

      {top3Share > 60 ? (
        <Card className="border-amber-500/40 bg-amber-500/[0.05]">
          <CardContent className="flex items-start gap-3">
            <CircleAlert className="mt-1 size-5 shrink-0 text-amber-700 dark:text-amber-500" />
            <div className="space-y-2">
              <div>
                <p className="font-heading font-semibold">
                  Forte dépendance à quelques clients
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Vos 3 plus gros clients représentent {top3Share.toFixed(0)}%
                  de votre volume client. Si l'un d'eux part, votre activité est
                  immédiatement fragilisée.
                </p>
              </div>
              <div className="rounded-md border border-border/50 bg-background/60 p-3 text-sm">
                <p className="font-medium">Ce que vous pouvez faire :</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <li>
                    • Lancer une action commerciale pour gagner 5 à 10 nouveaux
                    clients d'ici 6 mois
                  </li>
                  <li>
                    • Sécuriser les contrats actuels (engagement annuel,
                    pénalités de sortie)
                  </li>
                  <li>
                    • Diversifier les segments cibles (tailles d'entreprise,
                    secteurs, géographies)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tableau de bord clients</CardTitle>
          <CardDescription>
            Trié par volume facturé sur la période — les comptes auxiliaires
            (411xxx)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CounterpartyTable
            items={topCustomers}
            total={totalCustomerVolume}
            amountLabel="Facturé"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pour aller plus loin</CardTitle>
          <CardDescription>
            3 questions à se poser sur son portefeuille client
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border-l-2 border-primary/60 bg-primary/[0.04] p-4">
            <p className="mb-1 font-heading text-sm font-semibold">
              Quel est mon profil idéal ?
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Regardez vos top 5 clients : ont-ils des points communs (taille,
              secteur, besoin) ? Concentrez votre prospection sur ce profil.
            </p>
          </div>
          <div className="rounded-lg border-l-2 border-primary/60 bg-primary/[0.04] p-4">
            <p className="mb-1 font-heading text-sm font-semibold">
              Qui dort sur des factures ?
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Identifiez les clients aux délais de paiement les plus longs (DSO
              &gt; 60j) et mettez en place des relances automatiques.
            </p>
          </div>
          <div className="rounded-lg border-l-2 border-primary/60 bg-primary/[0.04] p-4">
            <p className="mb-1 font-heading text-sm font-semibold">
              Qui n'est plus actif ?
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Les clients qui n'ont pas commandé depuis 6 mois sont des
              opportunités de réactivation ciblée (offre fidélité, nouveau
              service).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
