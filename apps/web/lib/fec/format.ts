// Helpers de formatage pour l'UI dashboard.

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

const euroExactFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
})

const accurateNumberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
})

const compactIntegerFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
})

const compactMillionFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
})

const shortDateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

export function formatEuro(value: number): string {
  return euroFormatter.format(value)
}

export function formatEuroExact(value: number): string {
  return euroExactFormatter.format(value)
}

export function formatCompactNumber(
  value: number,
  options: { suffix?: string } = {}
): string {
  const finiteValue = Number.isFinite(value) ? value : 0
  const absoluteValue = Math.abs(finiteValue)
  const suffix = options.suffix ?? ""

  if (absoluteValue >= 1_000_000) {
    return `${compactMillionFormatter.format(finiteValue / 1_000_000)}M${suffix}`
  }

  if (absoluteValue >= 1_000) {
    const sign = finiteValue < 0 ? -1 : 1
    const roundedThousands = sign * Math.round(absoluteValue / 1_000)
    return `${compactIntegerFormatter.format(roundedThousands)}K${suffix}`
  }

  return `${compactIntegerFormatter.format(Math.round(finiteValue))}${suffix}`
}

export function formatEuroCompact(value: number): string {
  return formatCompactNumber(value, { suffix: "€" })
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export function formatAccurateNumber(value: number): string {
  return accurateNumberFormatter.format(value)
}

export function formatDate(value: Date): string {
  return dateFormatter.format(value)
}

export function formatShortDate(value: Date): string {
  return shortDateFormatter.format(value)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${String(bytes)} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`
}

export function formatDelta(value: number): {
  text: string
  tone: "up" | "down" | "neutral"
} {
  if (value === 0) return { text: "0%", tone: "neutral" }
  const text = `${value > 0 ? "+" : ""}${value.toFixed(1)}%`
  return { text, tone: value > 0 ? "up" : "down" }
}
