import { Button } from "@workspace/ui/components/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { FecDropzone } from "@/components/fec/fec-dropzone"

export default function UploadPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
              <span className="font-heading text-xs font-bold">c.</span>
            </div>
            <span className="font-heading text-base font-semibold tracking-tight">
              Clair
            </span>
          </Link>
          <Button variant="ghost" size="sm" render={<Link href="/" />}>
            <ArrowLeft />
            Accueil
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-10">
          <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Importez votre fichier FEC
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Le Fichier des Écritures Comptables est exporté depuis votre
            logiciel de comptabilité ou fourni par votre expert-comptable.
          </p>
        </div>

        <FecDropzone />
      </main>
    </div>
  )
}
