"use client"

import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Lightbulb,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { ActionableInsight } from "@/lib/fec/analytics"

const SEVERITY_STYLES: Record<
  ActionableInsight["severity"],
  { card: string; icon: string }
> = {
  critical: {
    card: "border-destructive/40 bg-destructive/[0.04]",
    icon: "text-destructive bg-destructive/10",
  },
  warning: {
    card: "border-amber-500/40 bg-amber-500/[0.05]",
    icon: "text-amber-700 dark:text-amber-500 bg-amber-500/10",
  },
  info: {
    card: "border-blue-500/30 bg-blue-500/[0.04]",
    icon: "text-blue-700 dark:text-blue-400 bg-blue-500/10",
  },
  positive: {
    card: "border-emerald-500/30 bg-emerald-500/[0.04]",
    icon: "text-emerald-700 dark:text-emerald-500 bg-emerald-500/10",
  },
}

const CATEGORY_LABELS: Record<ActionableInsight["category"], string> = {
  charges: "Charges",
  ventes: "Ventes",
  tresorerie: "Trésorerie",
  clients: "Clients",
  fournisseurs: "Fournisseurs",
  marge: "Marge",
}

function severityIcon(severity: ActionableInsight["severity"]) {
  switch (severity) {
    case "critical":
      return TriangleAlert
    case "warning":
      return CircleAlert
    case "info":
      return Lightbulb
    case "positive":
      return CheckCircle2
  }
}

export function InsightCard({ insight }: { insight: ActionableInsight }) {
  const Icon = severityIcon(insight.severity)
  const styles = SEVERITY_STYLES[insight.severity]

  return (
    <Card className={cn("gap-3", styles.card)}>
      <CardContent>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              styles.icon
            )}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-heading text-sm font-semibold">
                  {insight.title}
                </p>
                <Badge variant="outline" className="text-[10px]">
                  {CATEGORY_LABELS[insight.category]}
                </Badge>
                {insight.metric ? (
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {insight.metric}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {insight.description}
              </p>
            </div>
            <div className="rounded-md border border-border/50 bg-background/60 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                <ArrowRight className="size-3" />
                Action recommandée
              </p>
              <p className="text-sm">{insight.action}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
