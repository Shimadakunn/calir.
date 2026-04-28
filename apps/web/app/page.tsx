import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import {
  ArrowRight,
  Banknote,
  ChartLine,
  CircleAlert,
  ScanLine,
  ShieldCheck,
  Target,
  Wallet,
} from "lucide-react"
import Link from "next/link"

import { FormattedCurrency } from "@/components/fec/formatted-number"

const FEATURES = [
  {
    icon: ChartLine,
    title: "Vue d'ensemble en 5 secondes",
    text: "Chiffre d'affaires, charges, marge et trésorerie : les indicateurs vitaux de votre entreprise sur une seule page.",
  },
  {
    icon: Target,
    title: "Actions concrètes, pas du jargon",
    text: "On vous dit où réduire les charges, quels clients relancer, quels fournisseurs renégocier. En français, pas en comptable.",
  },
  {
    icon: ScanLine,
    title: "Drill-down progressif",
    text: "Vue d'ensemble, puis zoom par section : revenus, charges, trésorerie, clients, fournisseurs. À votre rythme.",
  },
  {
    icon: ShieldCheck,
    title: "Vos données restent chez vous",
    text: "Le fichier FEC est analysé directement dans votre navigateur. Rien n'est envoyé sur nos serveurs.",
  },
]

const STEPS = [
  {
    n: "01",
    title: "Exportez votre FEC",
    text: "Demandez le fichier des écritures comptables à votre expert-comptable, ou exportez-le depuis votre logiciel (Pennylane, Cegid, Sage, EBP, etc.).",
  },
  {
    n: "02",
    title: "Glissez-le dans Clair",
    text: "Format normalisé DGFiP. On détecte automatiquement l'encodage, les séparateurs et les colonnes.",
  },
  {
    n: "03",
    title: "Pilotez votre entreprise",
    text: "Tableau de bord clair, recommandations actionnables, alertes sur ce qui mérite votre attention.",
  },
]

const QUESTIONS = [
  {
    icon: Banknote,
    q: "Mon entreprise gagne-t-elle vraiment de l'argent ?",
    a: "Marge nette, EBE et résultat net en clair, par mois.",
  },
  {
    icon: CircleAlert,
    q: "Suis-je trop dépendant d'un client ?",
    a: "Concentration et top clients, avec alertes si la dépendance est risquée.",
  },
  {
    icon: Wallet,
    q: "Combien de temps tient ma trésorerie ?",
    a: "Solde actuel, projection, et délais de paiement clients vs fournisseurs.",
  },
]

export default function HomePage() {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="pointer-events-none absolute -top-32 left-1/2 size-[600px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <span className="font-heading text-sm font-bold">c.</span>
          </div>
          <span className="font-heading text-lg font-semibold tracking-tight">
            Clair
          </span>
        </div>
        <nav className="hidden items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="#fonctionnalites" />}
          >
            Fonctionnalités
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="#fonctionnement" />}
          >
            Comment ça marche
          </Button>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="#confidentialite" />}
          >
            Confidentialité
          </Button>
        </nav>
        <Button size="sm" render={<Link href="/upload" />}>
          Commencer
          <ArrowRight />
        </Button>
      </header>

      <main className="relative mx-auto w-full max-w-6xl px-6 pb-24">
        <section className="grid gap-10 pt-12 pb-20 md:grid-cols-[1.2fr_1fr] md:items-center md:pt-20">
          <div>
            <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
              Pour dirigeants, pas pour comptables
            </Badge>
            <h1 className="font-heading text-4xl leading-[1.05] font-bold tracking-tight md:text-6xl">
              La santé de votre entreprise,
              <br />
              <span className="text-primary">en clair.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Importez votre fichier FEC, obtenez immédiatement un tableau de
              bord lisible — et des actions concrètes à mener pour augmenter vos
              ventes, réduire vos charges, et sécuriser votre trésorerie.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" render={<Link href="/upload" />}>
                Importer mon FEC
                <ArrowRight />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link href="/dashboard?demo=1" />}
              >
                Voir une démo
              </Button>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Aucun compte requis — vos données ne quittent pas votre
              navigateur.
            </p>
          </div>

          <div className="relative">
            <Card className="relative overflow-hidden p-0">
              <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-2.5">
                <div className="size-2.5 rounded-full bg-destructive/40" />
                <div className="size-2.5 rounded-full bg-amber-500/40" />
                <div className="size-2.5 rounded-full bg-emerald-500/40" />
                <span className="ml-2 text-xs text-muted-foreground">
                  clair.app/dashboard
                </span>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">
                      Chiffre d'affaires
                    </p>
                    <p className="font-heading text-2xl font-bold">
                      <FormattedCurrency value={812_000} />
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-600">
                      +18% vs N-1
                    </p>
                  </Card>
                  <Card className="p-3">
                    <p className="text-xs text-muted-foreground">Marge nette</p>
                    <p className="font-heading text-2xl font-bold">12,4%</p>
                    <p className="mt-0.5 text-xs text-amber-600">En recul</p>
                  </Card>
                </div>
                <Card className="p-3">
                  <p className="mb-2 text-xs text-muted-foreground">
                    Évolution sur 12 mois
                  </p>
                  <div className="flex h-20 items-end gap-1">
                    {[35, 42, 38, 51, 48, 55, 60, 49, 65, 71, 68, 78].map(
                      (v) => (
                        <div
                          key={String(v)}
                          className="flex-1 rounded-sm bg-primary/70 transition-colors hover:bg-primary"
                          style={{ height: `${String(v)}%` }}
                        />
                      )
                    )}
                  </div>
                </Card>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold">
                        3 clients représentent 64% du CA
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Forte dépendance. Action : élargir le portefeuille.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="fonctionnalites" className="border-t py-20">
          <div className="mb-12 max-w-2xl">
            <Badge variant="outline" className="mb-4 rounded-full">
              Fonctionnalités
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              Tout ce qu'un dirigeant veut savoir,
              <br />
              rien de ce qui l'embrouille.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {FEATURES.map((f) => (
              <Card key={f.title} className="p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t py-20">
          <div className="mb-12 max-w-2xl">
            <Badge variant="outline" className="mb-4 rounded-full">
              Vos questions, en réponses claires
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              Les 3 questions qui vous empêchent de dormir.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {QUESTIONS.map((q) => (
              <Card key={q.q} className="border-primary/10 p-6">
                <q.icon className="mb-4 size-5 text-primary" />
                <p className="font-heading text-base leading-snug font-semibold">
                  {q.q}
                </p>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">{q.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="fonctionnement" className="border-t py-20">
          <div className="mb-12 max-w-2xl">
            <Badge variant="outline" className="mb-4 rounded-full">
              Comment ça marche
            </Badge>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              3 étapes, moins de 2 minutes.
            </h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-background p-8">
                <p className="mb-4 font-heading text-sm font-bold text-primary">
                  {s.n}
                </p>
                <h3 className="mb-3 font-heading text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="confidentialite"
          className="mt-20 rounded-3xl border bg-gradient-to-br from-primary/10 via-transparent to-transparent p-10 md:p-16"
        >
          <div className="grid gap-8 md:grid-cols-[2fr_3fr] md:items-center">
            <div>
              <ShieldCheck className="mb-4 size-10 text-primary" />
              <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
                Vos comptes restent chez vous.
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed">
              <p>
                Le fichier FEC contient toutes les écritures comptables de votre
                entreprise. C'est une donnée sensible.
              </p>
              <p className="text-muted-foreground">
                Clair fonctionne entièrement dans votre navigateur. Le parsing,
                les calculs, et le stockage local — tout reste sur votre
                machine. Aucun envoi vers un serveur, aucun compte à créer,
                aucune trace ailleurs que chez vous.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="secondary">100% client-side</Badge>
                <Badge variant="secondary">
                  localStorage chiffré navigateur
                </Badge>
                <Badge variant="secondary">Sans inscription</Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 text-center">
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight md:text-5xl">
            Prêt à voir votre entreprise en clair&nbsp;?
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" render={<Link href="/upload" />}>
              Importer mon FEC
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="/dashboard?demo=1" />}
            >
              Tester avec une démo
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row">
          <p>
            © {String(new Date().getFullYear())} Clair · Pilotez votre
            entreprise sans avoir à comprendre la comptabilité.
          </p>
          <p>
            Astuce&nbsp;: appuyez sur{" "}
            <kbd className="rounded bg-muted px-1.5 py-0.5">d</kbd> pour le mode
            sombre.
          </p>
        </div>
      </footer>
    </div>
  )
}
