"use client"

import { Button } from "@workspace/ui/components/button"
import { GitCompareArrows } from "lucide-react"

interface ComparisonToggleProps {
  active: boolean
  onToggle: () => void
  label?: string
}

export function ComparisonToggle({
  active,
  onToggle,
  label = "Comparer",
}: ComparisonToggleProps) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      aria-pressed={active}
    >
      <GitCompareArrows className="size-3.5" />
      {label}
    </Button>
  )
}
