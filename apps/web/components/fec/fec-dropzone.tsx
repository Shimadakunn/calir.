"use client"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import {
  CloudUpload,
  FileSpreadsheet,
  Loader2,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

import { formatFileSize } from "@/lib/fec/format"
import { useFecStore } from "@/lib/fec/store"

const ACCEPTED_EXTENSIONS = [".txt", ".csv", ".tsv"]

export function FecDropzone() {
  const router = useRouter()
  const { importFile, importDemo, importState } = useFecStore()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isProcessing = importState.status === "parsing"

  const handleFile = useCallback(
    async (file: File) => {
      setSelectedFile(file)
      try {
        await importFile(file)
        toast.success("Fichier analysé avec succès", {
          description: "Votre tableau de bord est prêt.",
        })
        router.push("/dashboard")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur lors de l'analyse"
        toast.error("Impossible d'analyser le fichier", {
          description: message,
        })
        setSelectedFile(null)
      }
    },
    [importFile, router]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        void handleFile(file)
      }
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        void handleFile(file)
      }
    },
    [handleFile]
  )

  const handleDemo = useCallback(async () => {
    try {
      await importDemo()
      toast.success("Démo chargée", {
        description: "Tableau de bord généré avec un jeu d'écritures fictif.",
      })
      router.push("/dashboard")
    } catch {
      toast.error("Impossible de charger la démo")
    }
  }, [importDemo, router])

  return (
    <div className="space-y-6">
      <Card
        className={cn(
          "relative overflow-hidden border-2 border-dashed p-0 transition-colors",
          isDragging && "border-primary bg-primary/5",
          isProcessing && "pointer-events-none opacity-80"
        )}
      >
        <label
          htmlFor="fec-file-input"
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center gap-4 px-6 py-16 text-center"
        >
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isProcessing ? (
              <Loader2 className="size-8 animate-spin" />
            ) : (
              <CloudUpload className="size-8" />
            )}
          </div>
          <div className="space-y-1.5">
            <p className="font-heading text-lg font-semibold">
              {isProcessing
                ? `Analyse de ${selectedFile?.name ?? "votre FEC"}…`
                : "Glissez votre fichier FEC ici"}
            </p>
            <p className="text-sm text-muted-foreground">
              ou cliquez pour le sélectionner ({ACCEPTED_EXTENSIONS.join(", ")})
            </p>
          </div>
          <input
            ref={inputRef}
            id="fec-file-input"
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleChange}
            className="sr-only"
            disabled={isProcessing}
          />
        </label>
      </Card>

      {importState.status === "error" ? (
        <Card className="border-destructive/30 bg-destructive/5 p-4">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div>
              <p className="font-medium">Le fichier n'a pas pu être analysé</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {importState.message}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Pas de FEC sous la main ?</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Découvrez Clair avec un jeu de données fictif (PME de services, 12
              mois).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDemo}
            disabled={isProcessing}
          >
            Charger la démo
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <ShieldCheck className="mb-2 size-4 text-primary" />
          <p className="text-sm font-medium">100% local</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Le fichier ne quitte jamais votre navigateur. Aucun upload serveur.
          </p>
        </Card>
        <Card className="p-4">
          <FileSpreadsheet className="mb-2 size-4 text-primary" />
          <p className="text-sm font-medium">Format normalisé DGFiP</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Tabulé ou pipe, UTF-8 ou Windows-1252. On gère tous les exports.
          </p>
        </Card>
      </div>

      {selectedFile ? (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="size-5 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Badge variant="secondary">
              {isProcessing ? "Analyse…" : "Reçu"}
            </Badge>
          </div>
        </Card>
      ) : null}

      <Separator />

      <div>
        <p className="mb-2 font-heading text-sm font-semibold">
          Comment exporter mon FEC ?
        </p>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>
            • <span className="font-medium text-foreground">Pennylane</span> :
            Paramètres &raquo; Comptabilité &raquo; Export FEC
          </li>
          <li>
            •{" "}
            <span className="font-medium text-foreground">
              Sage / EBP / Cegid
            </span>{" "}
            : Module Fiscalité &raquo; Export FEC
          </li>
          <li>
            •{" "}
            <span className="font-medium text-foreground">
              Quickbooks / Indy
            </span>{" "}
            : Profil &raquo; Comptabilité &raquo; Exports
          </li>
          <li>
            •{" "}
            <span className="font-medium text-foreground">
              Expert-comptable
            </span>{" "}
            : demandez-lui simplement &laquo;&nbsp;mon FEC pour l'exercice en
            cours&nbsp;&raquo;
          </li>
        </ul>
      </div>
    </div>
  )
}
