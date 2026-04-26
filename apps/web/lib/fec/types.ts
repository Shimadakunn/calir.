// Types pour les Fichiers d'Écritures Comptables (FEC) - format normalisé par la DGFiP.
// Référence : https://www.economie.gouv.fr/dgfip/controle-fiscal-des-comptabilites-informatisees

export interface FecEntry {
  // Identifiants journal
  journalCode: string
  journalLib: string

  // Identifiants écriture
  ecritureNum: string
  ecritureDate: Date
  ecritureLib: string

  // Compte du Plan Comptable Général (PCG)
  compteNum: string
  compteLib: string

  // Compte auxiliaire (clients/fournisseurs)
  compAuxNum: string
  compAuxLib: string

  // Pièce justificative
  pieceRef: string
  pieceDate: Date | null

  // Montants
  debit: number
  credit: number

  // Lettrage / validation
  ecritureLet: string
  dateLet: Date | null
  validDate: Date | null

  // Devise
  montantDevise: number | null
  idevise: string
}

export interface FecParseResult {
  entries: FecEntry[]
  warnings: string[]
  meta: {
    fileName: string
    fileSizeBytes: number
    encoding: string
    separator: "\t" | ";" | "|" | ","
    rowCount: number
    parsedAt: number
    minDate: Date | null
    maxDate: Date | null
  }
}

export interface FecParseError {
  message: string
  line?: number
  raw?: string
}

export class FecParseException extends Error {
  errors: FecParseError[]

  constructor(errors: FecParseError[]) {
    super(errors[0]?.message ?? "Erreur de parsing FEC")
    this.errors = errors
    this.name = "FecParseException"
  }
}
