// Projection de tresorerie a court terme : on part du solde reel des comptes 5
// (banque + caisse) puis on agrege les engagements deja contractes mais pas
// encore decaisses/encaisses (echeances depassees ou imminentes).
//
// La logique reflete un "tableau de financement court terme" simplifie :
// projectedCash = currentCash - totalOutflows + totalInflows
//
// On ne projette PAS les encours non echus (volontaire) : le but est de
// montrer ce qui est *deja en retard* ou *deja exigible*, pas une prevision
// sur 30/60/90 jours.

import {
  isSalaryPayableAccount,
  isSocialChargePayableAccount,
  isVatAccount,
} from "./accounts"
import type { FecEntry } from "./types"

export interface CashProjection {
  asOf: Date
  currentCash: number
  // Decaissements engages
  overduePayables: number // Fournisseurs echus
  vatPayable: number // TVA a decaisser (solde crediteur des 445x)
  salariesPayable: number // Salaires nets dus (solde crediteur des 421x)
  socialChargesPayable: number // URSSAF + autres organismes (43x)
  totalOutflows: number
  // Encaissements engages
  overdueReceivables: number // Clients echus
  totalInflows: number
  // Solde apres execution de tous les engagements
  projectedCash: number
}

// Pre-totaux issus des autres fonctions analytics (KPI cash + balance agee) :
// regroupes dans un objet pour eviter la pollution de la signature.
export interface CashProjectionContext {
  currentCash: number
  overduePayables: number
  overdueReceivables: number
}

export function computeCashProjection(
  entries: FecEntry[],
  asOf: Date,
  context: CashProjectionContext
): CashProjection {
  const { currentCash, overduePayables, overdueReceivables } = context
  // Solde net = credit - debit. Pour les comptes 4 (passifs envers tiers),
  // un solde crediteur > 0 represente une dette : ce qu'on doit a l'Etat /
  // au personnel / aux organismes sociaux.
  let vatNet = 0
  let salariesNet = 0
  let socialNet = 0
  for (const e of entries) {
    const c = e.compteNum
    if (isVatAccount(c)) vatNet += e.credit - e.debit
    else if (isSalaryPayableAccount(c)) salariesNet += e.credit - e.debit
    else if (isSocialChargePayableAccount(c)) socialNet += e.credit - e.debit
  }
  // Si negatif (ex : credit de TVA, on a paye plus que collecte), on ne projette
  // pas un encaissement futur de l'Etat — clamp a 0 pour rester conservateur.
  const vatPayable = Math.max(0, vatNet)
  const salariesPayable = Math.max(0, salariesNet)
  const socialChargesPayable = Math.max(0, socialNet)

  const totalOutflows =
    overduePayables + vatPayable + salariesPayable + socialChargesPayable
  const totalInflows = overdueReceivables
  const projectedCash = currentCash - totalOutflows + totalInflows

  return {
    asOf,
    currentCash,
    overduePayables,
    vatPayable,
    salariesPayable,
    socialChargesPayable,
    totalOutflows,
    overdueReceivables,
    totalInflows,
    projectedCash,
  }
}
