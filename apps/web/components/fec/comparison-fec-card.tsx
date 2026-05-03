"use client"

import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  CloudUpload,
  GitCompareArrows,
  Loader2,
  type LucideIcon,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

import { FormattedNumber } from "@/components/fec/formatted-number"
import type { DashboardData } from "@/lib/fec/analytics"
import { formatShortDate } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

const ACCEPTED_EXTENSIONS = [".txt", ".csv", ".tsv"]

function LoadedComparisonCard({
  data,
  onRemove,
}: {
  data: DashboardData
  onRemove: () => void
}) {
  return (
    <div className="mx-1 mb-1 rounded-lg border border-dashed border-border bg-muted/20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Comparaison
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {formatShortDate(data.period.startDate)} →{" "}
            {formatShortDate(data.period.endDate)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <FormattedNumber value={data.meta.rowCount} /> écritures
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Retirer le FEC de comparaison"
          className="-mt-1 -mr-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}

function ComparisonOptionButton({
  icon: Icon,
  title,
  description,
  onClick,
  disabled,
}: {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

function ImportDialogBody({
  isProcessing,
  fileName,
  errorMessage,
  onPickFile,
  onLoadDemo,
}: {
  isProcessing: boolean
  fileName: string | null
  errorMessage: string | null
  onPickFile: () => void
  onLoadDemo: () => void
}) {
  return (
    <>
      {isProcessing ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Analyse de {fileName ?? "votre FEC"}…</span>
        </div>
      ) : null}

      <div className="grid gap-2.5">
        <ComparisonOptionButton
          icon={CloudUpload}
          title="Importer un fichier FEC"
          description={ACCEPTED_EXTENSIONS.join(", ")}
          onClick={onPickFile}
          disabled={isProcessing}
        />
        <ComparisonOptionButton
          icon={Sparkles}
          title="Charger une démo"
          description="PME services, 12 mois fictifs"
          onClick={onLoadDemo}
          disabled={isProcessing}
        />
      </div>

      {errorMessage ? (
        <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="text-xs text-muted-foreground">{errorMessage}</p>
        </div>
      ) : null}
    </>
  )
}

export function ComparisonFecCard() {
  const {
    comparisonData,
    comparisonImportState,
    importComparisonFile,
    importComparisonDemo,
    resetComparison,
  } = useFecStore()

  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isProcessing = comparisonImportState.status === "parsing"
  const fileName =
    comparisonImportState.status === "parsing"
      ? comparisonImportState.fileName
      : null
  const errorMessage =
    comparisonImportState.status === "error"
      ? comparisonImportState.message
      : null

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        await importComparisonFile(file)
        toast.success("FEC de comparaison chargé", { description: file.name })
        setOpen(false)
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Impossible d'analyser le fichier."
        toast.error("Erreur de chargement", { description: message })
      } finally {
        if (inputRef.current) inputRef.current.value = ""
      }
    },
    [importComparisonFile]
  )

  const handleDemo = useCallback(async () => {
    try {
      await importComparisonDemo()
      toast.success("Démo de comparaison chargée")
      setOpen(false)
    } catch {
      toast.error("Impossible de charger la démo")
    }
  }, [importComparisonDemo])

  if (comparisonData)
    return (
      <LoadedComparisonCard data={comparisonData} onRemove={resetComparison} />
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="mx-1 mb-1 h-auto justify-center gap-2 border-dashed py-2.5 text-muted-foreground hover:text-foreground"
            disabled={isProcessing}
          />
        }
      >
        <GitCompareArrows className="size-3.5" />
        <span>Comparer avec un autre FEC</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comparer avec un autre FEC</DialogTitle>
          <DialogDescription>
            Importez un second FEC ou chargez une démo pour le comparer au FEC
            actuellement chargé.
          </DialogDescription>
        </DialogHeader>

        <ImportDialogBody
          isProcessing={isProcessing}
          fileName={fileName}
          errorMessage={errorMessage}
          onPickFile={() => inputRef.current?.click()}
          onLoadDemo={handleDemo}
        />

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="sr-only"
          disabled={isProcessing}
        />
      </DialogContent>
    </Dialog>
  )
}
