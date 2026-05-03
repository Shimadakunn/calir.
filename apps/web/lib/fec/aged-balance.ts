// Balance agee (aged balance) : pour chaque tiers, on isole les factures
// restant a payer en faisant un matching FIFO entre factures et reglements.
// Plus robuste que de se baser uniquement sur le lettrage (`ecritureLet`),
// souvent absent dans les FEC reels. Les totaux sont identiques quand le
// lettrage est correctement applique.

import { isCustomerAccount, isSupplierAccount } from "./accounts"
import type { FecEntry } from "./types"

export interface AgedBalanceBucket {
  key: "notDue" | "0_30" | "31_60" | "60plus"
  label: string
  count: number
  amount: number
}

export interface AgedBalanceCounterparty {
  accountNum: string
  label: string
  totalAmount: number
  overdueAmount: number
  oldestDaysOverdue: number
  invoiceCount: number
}

export interface AgedBalance {
  asOf: Date
  paymentDays: number
  totalAmount: number
  invoiceCount: number
  partyCount: number
  overdueAmount: number
  overdueInvoiceCount: number
  overduePartyCount: number
  notDueAmount: number
  notDueInvoiceCount: number
  notDuePartyCount: number
  buckets: AgedBalanceBucket[]
  topOverdueParties: AgedBalanceCounterparty[]
}

const PAYMENT_DAYS_DEFAULT = 30
const TOP_N_DEFAULT = 5
const AMOUNT_TOLERANCE = 0.01
const DAY_MS = 86_400_000

interface OpenInvoice {
  partyKey: string
  partyLabel: string
  date: Date
  amount: number
}

interface QueuedInvoice {
  date: Date
  amount: number
}

// Consomme les factures les plus anciennes a hauteur de `payment`.
// Retourne le residu de paiement non impute (avoir / acompte).
function applyPaymentFIFO(queue: QueuedInvoice[], payment: number): number {
  let remaining = payment
  while (remaining > 0 && queue.length > 0) {
    const front = queue[0]!
    const consumed = Math.min(remaining, front.amount)
    front.amount -= consumed
    remaining -= consumed
    if (front.amount <= AMOUNT_TOLERANCE) queue.shift()
  }
  return remaining
}

// Pour un tiers, applique les regles de matching FIFO et renvoie la queue
// finale des factures restant ouvertes.
function netOneParty(
  partyEntries: FecEntry[],
  signMultiplier: 1 | -1
): QueuedInvoice[] {
  partyEntries.sort(
    (a, b) => a.ecritureDate.getTime() - b.ecritureDate.getTime()
  )

  const queue: QueuedInvoice[] = []
  // Avoirs / paiements anticipes pas encore imputes a une facture
  let creditPool = 0

  for (const e of partyEntries) {
    const value = signMultiplier === 1 ? e.debit - e.credit : e.credit - e.debit
    if (value > AMOUNT_TOLERANCE) {
      const applied = Math.min(value, creditPool)
      creditPool -= applied
      const remaining = value - applied
      if (remaining > AMOUNT_TOLERANCE)
        queue.push({ date: e.ecritureDate, amount: remaining })
    } else if (value < -AMOUNT_TOLERANCE) {
      const residue = applyPaymentFIFO(queue, -value)
      if (residue > AMOUNT_TOLERANCE) creditPool += residue
    }
  }

  return queue
}

function netOpenInvoicesByParty(
  entries: FecEntry[],
  isAccountFn: (compteNum: string) => boolean,
  signMultiplier: 1 | -1
): OpenInvoice[] {
  const byParty = new Map<string, { label: string; entries: FecEntry[] }>()
  for (const e of entries) {
    if (!isAccountFn(e.compteNum)) continue
    const key = e.compAuxNum || e.compteNum
    const label = e.compAuxLib || e.compteLib || key
    let group = byParty.get(key)
    if (!group) {
      group = { label, entries: [] }
      byParty.set(key, group)
    }
    group.entries.push(e)
  }

  const open: OpenInvoice[] = []
  for (const [partyKey, { label, entries: partyEntries }] of byParty) {
    const queue = netOneParty(partyEntries, signMultiplier)
    for (const inv of queue) {
      if (inv.amount > AMOUNT_TOLERANCE)
        open.push({
          partyKey,
          partyLabel: label,
          date: inv.date,
          amount: inv.amount,
        })
    }
  }

  return open
}

function makeBuckets(): Record<AgedBalanceBucket["key"], AgedBalanceBucket> {
  return {
    notDue: { key: "notDue", label: "Non échu", count: 0, amount: 0 },
    "0_30": { key: "0_30", label: "0 à 30 j", count: 0, amount: 0 },
    "31_60": { key: "31_60", label: "31 à 60 j", count: 0, amount: 0 },
    "60plus": { key: "60plus", label: "+ 60 j", count: 0, amount: 0 },
  }
}

function bucketForDays(
  buckets: Record<AgedBalanceBucket["key"], AgedBalanceBucket>,
  daysOverdue: number
): AgedBalanceBucket {
  if (daysOverdue < 0) return buckets.notDue
  if (daysOverdue <= 30) return buckets["0_30"]
  if (daysOverdue <= 60) return buckets["31_60"]
  return buckets["60plus"]
}

interface AgedBalanceOptions {
  asOf: Date
  paymentDays?: number
  topN?: number
}

interface AccountSelector {
  isAccountFn: (compteNum: string) => boolean
  signMultiplier: 1 | -1
}

function aggregateOpenInvoices(
  open: OpenInvoice[],
  asOfMs: number,
  paymentDays: number
): {
  buckets: Record<AgedBalanceBucket["key"], AgedBalanceBucket>
  partyAgg: Map<string, AgedBalanceCounterparty>
  partySet: Set<string>
  overduePartySet: Set<string>
  notDuePartySet: Set<string>
  totals: {
    totalAmount: number
    invoiceCount: number
    overdueAmount: number
    overdueInvoiceCount: number
    notDueAmount: number
    notDueInvoiceCount: number
  }
} {
  const buckets = makeBuckets()
  const partyAgg = new Map<string, AgedBalanceCounterparty>()
  const partySet = new Set<string>()
  const overduePartySet = new Set<string>()
  const notDuePartySet = new Set<string>()

  let totalAmount = 0
  let invoiceCount = 0
  let overdueAmount = 0
  let overdueInvoiceCount = 0
  let notDueAmount = 0
  let notDueInvoiceCount = 0

  for (const inv of open) {
    const dueMs = inv.date.getTime() + paymentDays * DAY_MS
    const daysOverdue = Math.floor((asOfMs - dueMs) / DAY_MS)

    totalAmount += inv.amount
    invoiceCount += 1
    partySet.add(inv.partyKey)

    let agg = partyAgg.get(inv.partyKey)
    if (!agg) {
      agg = {
        accountNum: inv.partyKey,
        label: inv.partyLabel,
        totalAmount: 0,
        overdueAmount: 0,
        oldestDaysOverdue: daysOverdue,
        invoiceCount: 0,
      }
      partyAgg.set(inv.partyKey, agg)
    }
    agg.totalAmount += inv.amount
    agg.invoiceCount += 1
    if (daysOverdue > agg.oldestDaysOverdue) agg.oldestDaysOverdue = daysOverdue

    const bucket = bucketForDays(buckets, daysOverdue)
    bucket.count += 1
    bucket.amount += inv.amount

    if (daysOverdue < 0) {
      notDueAmount += inv.amount
      notDueInvoiceCount += 1
      notDuePartySet.add(inv.partyKey)
    } else {
      overdueAmount += inv.amount
      overdueInvoiceCount += 1
      overduePartySet.add(inv.partyKey)
      agg.overdueAmount += inv.amount
    }
  }

  return {
    buckets,
    partyAgg,
    partySet,
    overduePartySet,
    notDuePartySet,
    totals: {
      totalAmount,
      invoiceCount,
      overdueAmount,
      overdueInvoiceCount,
      notDueAmount,
      notDueInvoiceCount,
    },
  }
}

export function computeAgedBalance(
  entries: FecEntry[],
  selector: AccountSelector,
  options: AgedBalanceOptions
): AgedBalance {
  const paymentDays = options.paymentDays ?? PAYMENT_DAYS_DEFAULT
  const topN = options.topN ?? TOP_N_DEFAULT
  const open = netOpenInvoicesByParty(
    entries,
    selector.isAccountFn,
    selector.signMultiplier
  )
  const {
    buckets,
    partyAgg,
    partySet,
    overduePartySet,
    notDuePartySet,
    totals,
  } = aggregateOpenInvoices(open, options.asOf.getTime(), paymentDays)

  const topOverdueParties = Array.from(partyAgg.values())
    .filter((p) => p.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, topN)

  return {
    asOf: options.asOf,
    paymentDays,
    totalAmount: totals.totalAmount,
    invoiceCount: totals.invoiceCount,
    partyCount: partySet.size,
    overdueAmount: totals.overdueAmount,
    overdueInvoiceCount: totals.overdueInvoiceCount,
    overduePartyCount: overduePartySet.size,
    notDueAmount: totals.notDueAmount,
    notDueInvoiceCount: totals.notDueInvoiceCount,
    notDuePartyCount: notDuePartySet.size,
    buckets: Object.values(buckets),
    topOverdueParties,
  }
}

export function computeAgedReceivables(
  entries: FecEntry[],
  asOf: Date
): AgedBalance {
  return computeAgedBalance(
    entries,
    { isAccountFn: isCustomerAccount, signMultiplier: 1 },
    { asOf }
  )
}

export function computeAgedPayables(
  entries: FecEntry[],
  asOf: Date
): AgedBalance {
  return computeAgedBalance(
    entries,
    { isAccountFn: isSupplierAccount, signMultiplier: -1 },
    { asOf }
  )
}
