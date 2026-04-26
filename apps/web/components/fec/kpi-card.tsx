"use client"

import { ArrowDown, ArrowRight, ArrowUp, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

export interface KpiCardProps {
  label: string
  value: string
  icon?: LucideIcon
  hint?: string
  trend?: {
    direction: "up" | "down" | "neutral"
    text: string
    tone?: "positive" | "negative" | "neutral"
  }
  tone?: "default" | "success" | "warning" | "danger"
  className?: string
  footer?: ReactNode
}

const TONE_STYLES: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "",
  success: "border-emerald-500/30 bg-emerald-500/[0.03]",
  warning: "border-amber-500/30 bg-amber-500/[0.03]",
  danger: "border-destructive/30 bg-destructive/[0.04]",
}

const TREND_STYLES: Record<
  NonNullable<NonNullable<KpiCardProps["trend"]>["tone"]>,
  string
> = {
  positive: "text-emerald-600 dark:text-emerald-500",
  negative: "text-destructive",
  neutral: "text-muted-foreground",
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  trend,
  tone = "default",
  className,
  footer,
}: KpiCardProps) {
  return (
    <Card className={cn(TONE_STYLES[tone], "gap-3", className)}>
      <CardContent className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          {Icon ? (
            <Icon className="size-4 shrink-0 text-muted-foreground" />
          ) : null}
        </div>
        <p className="font-heading text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </p>
        {trend ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium tabular-nums",
                TREND_STYLES[trend.tone ?? "neutral"]
              )}
            >
              {trend.direction === "up" ? (
                <ArrowUp className="size-3" />
              ) : trend.direction === "down" ? (
                <ArrowDown className="size-3" />
              ) : (
                <ArrowRight className="size-3" />
              )}
              {trend.text}
            </span>
            {hint ? (
              <span className="text-muted-foreground">· {hint}</span>
            ) : null}
          </div>
        ) : hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
        {footer}
      </CardContent>
    </Card>
  )
}
