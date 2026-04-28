import { cn } from "@workspace/ui/lib/utils"
import type { ComponentPropsWithoutRef } from "react"

import {
  formatAccurateNumber,
  formatCompactNumber,
  formatEuroCompact,
  formatEuroExact,
} from "@/lib/fec/format"

interface FormattedNumberProps extends Omit<
  ComponentPropsWithoutRef<"span">,
  "children"
> {
  value: number
  kind?: "number" | "currency"
  unit?: string
  tooltip?: boolean
}

export function FormattedNumber({
  value,
  kind = "number",
  unit,
  tooltip = true,
  className,
  title,
  "aria-label": ariaLabel,
  ...props
}: FormattedNumberProps) {
  const suffix = formatUnitSuffix(unit)
  const display = formatDisplayValue(value, kind, suffix)
  const accurate = formatAccurateValue(value, kind, suffix)
  const showTooltip = shouldShowTooltip(value, tooltip)

  return (
    <span
      {...props}
      aria-label={ariaLabel ?? (showTooltip ? accurate : undefined)}
      className={cn(showTooltip && "cursor-help", className)}
      title={title ?? (showTooltip ? accurate : undefined)}
    >
      {display}
    </span>
  )
}

export function FormattedCurrency(
  props: Omit<FormattedNumberProps, "kind" | "unit">
) {
  return <FormattedNumber {...props} kind="currency" />
}

function formatUnitSuffix(unit: string | undefined): string {
  return unit ? ` ${unit}` : ""
}

function formatDisplayValue(
  value: number,
  kind: NonNullable<FormattedNumberProps["kind"]>,
  suffix: string
): string {
  if (kind === "currency") return formatEuroCompact(value)
  return formatCompactNumber(value, { suffix })
}

function formatAccurateValue(
  value: number,
  kind: NonNullable<FormattedNumberProps["kind"]>,
  suffix: string
): string {
  if (kind === "currency") return formatEuroExact(value)
  return `${formatAccurateNumber(value)}${suffix}`
}

function shouldShowTooltip(value: number, tooltip: boolean): boolean {
  return tooltip && Math.abs(value) >= 1_000
}
