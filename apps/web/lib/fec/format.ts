// Helpers de formatage pour l'UI dashboard.

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

const euroCompactFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 1,
  notation: "compact",
})

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
})

const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
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

export function formatEuroCompact(value: number): string {
  return euroCompactFormatter.format(value)
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100)
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
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
