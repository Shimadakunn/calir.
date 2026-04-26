// Generateur de FEC fictif pour la demo. Simule l'activite d'une PME francaise
// (15 personnes, SaaS / services) sur 12 mois avec une croissance et une saisonnalite.

interface DemoEntry {
  journalCode: string
  journalLib: string
  ecritureNum: string
  ecritureDate: Date
  compteNum: string
  compteLib: string
  compAuxNum: string
  compAuxLib: string
  pieceRef: string
  pieceDate: Date
  ecritureLib: string
  debit: number
  credit: number
}

function dateStr(d: Date): string {
  const y = String(d.getUTCFullYear())
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}${m}${day}`
}

function fr(value: number): string {
  return value.toFixed(2).replace(".", ",")
}

const CUSTOMERS = [
  { num: "411AXIO", lib: "AXIOME CONSEIL SAS", weight: 0.32 },
  { num: "411DELT", lib: "DELTAMED INDUSTRIES", weight: 0.18 },
  { num: "411ORBI", lib: "ORBITAL DESIGN", weight: 0.14 },
  { num: "411MERI", lib: "MERIDIA RETAIL", weight: 0.11 },
  { num: "411NOVA", lib: "NOVASTAR LOGISTIQUE", weight: 0.08 },
  { num: "411PLAT", lib: "PLATEAU CONSULTING", weight: 0.07 },
  { num: "411TYRO", lib: "TYROLE SARL", weight: 0.05 },
  { num: "411LIVA", lib: "LIVADIA STUDIO", weight: 0.03 },
  { num: "411BASTI", lib: "BASTILLE EVENTS", weight: 0.02 },
]

const SUPPLIERS = [
  {
    num: "401AWS",
    lib: "AMAZON WEB SERVICES EMEA",
    account: "613500",
    group: "infra",
  },
  {
    num: "401GOOG",
    lib: "GOOGLE WORKSPACE FRANCE",
    account: "626000",
    group: "saas",
  },
  {
    num: "401WEW",
    lib: "WEWORK FRANCE SAS",
    account: "613200",
    group: "loyer",
  },
  {
    num: "401EDF",
    lib: "EDF ENTREPRISES",
    account: "606100",
    group: "energie",
  },
  {
    num: "401URSS",
    lib: "URSSAF ILE-DE-FRANCE",
    account: "431000",
    group: "social",
  },
  {
    num: "401CCM",
    lib: "CABINET COMPTABLE MARTIN",
    account: "622600",
    group: "honoraires",
  },
  {
    num: "401AXA",
    lib: "AXA FRANCE IARD",
    account: "616000",
    group: "assurance",
  },
  { num: "401SFR", lib: "SFR BUSINESS", account: "626100", group: "telecom" },
  {
    num: "401LIN",
    lib: "LINKEDIN MARKETING SOLUTIONS",
    account: "623000",
    group: "marketing",
  },
  {
    num: "401STRI",
    lib: "STRIPE PAYMENTS EUROPE",
    account: "627800",
    group: "banque",
  },
]

const PAYROLL_ITEMS = [
  { account: "641100", lib: "Salaires bruts", weight: 0.7 },
  { account: "645100", lib: "Charges URSSAF", weight: 0.22 },
  { account: "645300", lib: "Caisses de retraite", weight: 0.06 },
  { account: "647000", lib: "Mutuelle et prevoyance", weight: 0.02 },
]

const SUPPLIER_MONTHLY_BASE = [
  {
    num: "401AWS",
    account: "613500",
    lib: "AWS - Hebergement",
    min: 1800,
    max: 2600,
  },
  {
    num: "401GOOG",
    account: "626000",
    lib: "Google Workspace",
    min: 320,
    max: 420,
  },
  {
    num: "401WEW",
    account: "613200",
    lib: "Loyer bureaux",
    min: 4200,
    max: 4200,
  },
  { num: "401EDF", account: "606100", lib: "Electricite", min: 250, max: 480 },
  {
    num: "401CCM",
    account: "622600",
    lib: "Honoraires comptables",
    min: 850,
    max: 1200,
  },
  {
    num: "401AXA",
    account: "616000",
    lib: "Assurance RC pro",
    min: 220,
    max: 220,
  },
  {
    num: "401SFR",
    account: "626100",
    lib: "Telecom et internet",
    min: 380,
    max: 460,
  },
  {
    num: "401LIN",
    account: "623000",
    lib: "Campagnes acquisition",
    min: 1200,
    max: 3500,
  },
  {
    num: "401STRI",
    account: "627800",
    lib: "Frais bancaires Stripe",
    min: 180,
    max: 320,
  },
]

function pseudoRandom(seed: number): () => number {
  // PRNG deterministe (mulberry32) pour avoir des donnees stables entre les rendus.
  let t = seed
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

export function generateDemoEntries(): DemoEntry[] {
  const random = pseudoRandom(42)
  const entries: DemoEntry[] = []
  let entryCounter = 1

  // Periode : 12 derniers mois finissant au mois precedent du jour courant
  const now = new Date()
  const endMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)
  )
  const startMonth = new Date(
    Date.UTC(endMonth.getUTCFullYear() - 1, endMonth.getUTCMonth() + 1, 1)
  )

  // Solde de tresorerie initial via une ecriture d'a-nouveau (1er jour de la periode)
  const opening = 32_000
  entries.push({
    journalCode: "AN",
    journalLib: "A-Nouveaux",
    ecritureNum: String(entryCounter++).padStart(6, "0"),
    ecritureDate: startMonth,
    compteNum: "512000",
    compteLib: "Banque BNP Paribas",
    compAuxNum: "",
    compAuxLib: "",
    pieceRef: "AN-OUV",
    pieceDate: startMonth,
    ecritureLib: "Solde a nouveau banque",
    debit: opening,
    credit: 0,
  })
  entries.push({
    journalCode: "AN",
    journalLib: "A-Nouveaux",
    ecritureNum: String(entryCounter - 1).padStart(6, "0"),
    ecritureDate: startMonth,
    compteNum: "101000",
    compteLib: "Capital social",
    compAuxNum: "",
    compAuxLib: "",
    pieceRef: "AN-OUV",
    pieceDate: startMonth,
    ecritureLib: "Solde a nouveau capital",
    debit: 0,
    credit: opening,
  })

  // Tendance : croissance lineaire +2% par mois avec un dip au mois 7 (-15%) et saisonnalite ete (-10% en juillet/aout)
  for (let m = 0; m < 12; m++) {
    const monthDate = new Date(
      Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() + m, 1)
    )
    const monthEnd = new Date(
      Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)
    )
    const monthIdx = monthDate.getUTCMonth()

    const isSummer = monthIdx === 6 || monthIdx === 7
    const isDip = m === 7
    const growth = 1 + 0.02 * m
    const seasonality = isSummer ? 0.85 : 1
    const dipFactor = isDip ? 0.78 : 1
    const monthlyTarget = 58_000 * growth * seasonality * dipFactor

    // === CHIFFRE D'AFFAIRES ===
    const dayOfInvoice = 5 + Math.floor(random() * 20)
    const invoiceDate = new Date(
      Date.UTC(
        monthDate.getUTCFullYear(),
        monthDate.getUTCMonth(),
        Math.min(dayOfInvoice, monthEnd.getUTCDate())
      )
    )

    for (const customer of CUSTOMERS) {
      const noise = 0.85 + random() * 0.3
      const amountHt =
        Math.round(monthlyTarget * customer.weight * noise * 100) / 100
      const tva = Math.round(amountHt * 0.2 * 100) / 100
      const amountTtc = Math.round((amountHt + tva) * 100) / 100
      if (amountHt < 50) continue

      const num = String(entryCounter++).padStart(6, "0")
      const ref = `FACT${String(monthDate.getUTCFullYear()).slice(2)}${String(monthIdx + 1).padStart(2, "0")}-${customer.num.slice(3)}`

      entries.push({
        journalCode: "VE",
        journalLib: "Ventes",
        ecritureNum: num,
        ecritureDate: invoiceDate,
        compteNum: customer.num,
        compteLib: customer.lib,
        compAuxNum: customer.num,
        compAuxLib: customer.lib,
        pieceRef: ref,
        pieceDate: invoiceDate,
        ecritureLib: `Facture ${customer.lib}`,
        debit: amountTtc,
        credit: 0,
      })
      entries.push({
        journalCode: "VE",
        journalLib: "Ventes",
        ecritureNum: num,
        ecritureDate: invoiceDate,
        compteNum: "706000",
        compteLib: "Prestations de services",
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: ref,
        pieceDate: invoiceDate,
        ecritureLib: `Facture ${customer.lib}`,
        debit: 0,
        credit: amountHt,
      })
      entries.push({
        journalCode: "VE",
        journalLib: "Ventes",
        ecritureNum: num,
        ecritureDate: invoiceDate,
        compteNum: "445710",
        compteLib: "TVA collectee 20%",
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: ref,
        pieceDate: invoiceDate,
        ecritureLib: `Facture ${customer.lib}`,
        debit: 0,
        credit: tva,
      })

      // Encaissement client (45 jours plus tard en moyenne, parfois plus pour Axiome qui paye lentement)
      const paymentDelay =
        customer.num === "411AXIO" ? 65 : 30 + Math.floor(random() * 30)
      const paymentDate = new Date(
        invoiceDate.getTime() + paymentDelay * 86_400_000
      )
      // On ne genere l'encaissement que s'il tombe dans la periode couverte
      if (paymentDate <= endMonth) {
        const payNum = String(entryCounter++).padStart(6, "0")
        entries.push({
          journalCode: "BQ",
          journalLib: "Banque",
          ecritureNum: payNum,
          ecritureDate: paymentDate,
          compteNum: "512000",
          compteLib: "Banque BNP Paribas",
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: ref,
          pieceDate: paymentDate,
          ecritureLib: `Reglement ${customer.lib}`,
          debit: amountTtc,
          credit: 0,
        })
        entries.push({
          journalCode: "BQ",
          journalLib: "Banque",
          ecritureNum: payNum,
          ecritureDate: paymentDate,
          compteNum: customer.num,
          compteLib: customer.lib,
          compAuxNum: customer.num,
          compAuxLib: customer.lib,
          pieceRef: ref,
          pieceDate: paymentDate,
          ecritureLib: `Reglement ${customer.lib}`,
          debit: 0,
          credit: amountTtc,
        })
      }
    }

    // === ACHATS RECURRENTS FOURNISSEURS ===
    for (const sup of SUPPLIER_MONTHLY_BASE) {
      const supplierMeta = SUPPLIERS.find((s) => s.num === sup.num)
      if (!supplierMeta) continue
      const noise = 0.9 + random() * 0.2
      const amountHt =
        Math.round((sup.min + (sup.max - sup.min) * random()) * noise * 100) /
        100
      const tva = Math.round(amountHt * 0.2 * 100) / 100
      const amountTtc = Math.round((amountHt + tva) * 100) / 100

      const factDay = 8 + Math.floor(random() * 18)
      const factDate = new Date(
        Date.UTC(
          monthDate.getUTCFullYear(),
          monthDate.getUTCMonth(),
          Math.min(factDay, monthEnd.getUTCDate())
        )
      )
      const num = String(entryCounter++).padStart(6, "0")
      const ref = `${sup.num}-${String(monthDate.getUTCFullYear()).slice(2)}${String(monthIdx + 1).padStart(2, "0")}`

      entries.push({
        journalCode: "AC",
        journalLib: "Achats",
        ecritureNum: num,
        ecritureDate: factDate,
        compteNum: sup.account,
        compteLib: sup.lib,
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: ref,
        pieceDate: factDate,
        ecritureLib: sup.lib,
        debit: amountHt,
        credit: 0,
      })
      entries.push({
        journalCode: "AC",
        journalLib: "Achats",
        ecritureNum: num,
        ecritureDate: factDate,
        compteNum: "445660",
        compteLib: "TVA deductible 20%",
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: ref,
        pieceDate: factDate,
        ecritureLib: sup.lib,
        debit: tva,
        credit: 0,
      })
      entries.push({
        journalCode: "AC",
        journalLib: "Achats",
        ecritureNum: num,
        ecritureDate: factDate,
        compteNum: sup.num,
        compteLib: supplierMeta.lib,
        compAuxNum: sup.num,
        compAuxLib: supplierMeta.lib,
        pieceRef: ref,
        pieceDate: factDate,
        ecritureLib: sup.lib,
        debit: 0,
        credit: amountTtc,
      })

      // Paiement fournisseur a 30 jours
      const payDate = new Date(factDate.getTime() + 30 * 86_400_000)
      if (payDate <= endMonth) {
        const payNum = String(entryCounter++).padStart(6, "0")
        entries.push({
          journalCode: "BQ",
          journalLib: "Banque",
          ecritureNum: payNum,
          ecritureDate: payDate,
          compteNum: sup.num,
          compteLib: supplierMeta.lib,
          compAuxNum: sup.num,
          compAuxLib: supplierMeta.lib,
          pieceRef: ref,
          pieceDate: payDate,
          ecritureLib: `Reglement ${supplierMeta.lib}`,
          debit: amountTtc,
          credit: 0,
        })
        entries.push({
          journalCode: "BQ",
          journalLib: "Banque",
          ecritureNum: payNum,
          ecritureDate: payDate,
          compteNum: "512000",
          compteLib: "Banque BNP Paribas",
          compAuxNum: "",
          compAuxLib: "",
          pieceRef: ref,
          pieceDate: payDate,
          ecritureLib: `Reglement ${supplierMeta.lib}`,
          debit: 0,
          credit: amountTtc,
        })
      }
    }

    // === SALAIRES (fin de mois) ===
    const payrollTotal = 28_000 * (1 + 0.015 * m)
    const payrollDate = new Date(
      Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)
    )
    const payrollNum = String(entryCounter++).padStart(6, "0")
    for (const item of PAYROLL_ITEMS) {
      const amount = Math.round(payrollTotal * item.weight * 100) / 100
      entries.push({
        journalCode: "OD",
        journalLib: "Operations diverses",
        ecritureNum: payrollNum,
        ecritureDate: payrollDate,
        compteNum: item.account,
        compteLib: item.lib,
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: `PAIE-${String(monthIdx + 1).padStart(2, "0")}`,
        pieceDate: payrollDate,
        ecritureLib: `Charges de personnel - ${item.lib}`,
        debit: amount,
        credit: 0,
      })
    }
    entries.push({
      journalCode: "OD",
      journalLib: "Operations diverses",
      ecritureNum: payrollNum,
      ecritureDate: payrollDate,
      compteNum: "421000",
      compteLib: "Personnel - remunerations dues",
      compAuxNum: "",
      compAuxLib: "",
      pieceRef: `PAIE-${String(monthIdx + 1).padStart(2, "0")}`,
      pieceDate: payrollDate,
      ecritureLib: "Salaires nets a payer",
      debit: 0,
      credit: Math.round(payrollTotal * 100) / 100,
    })
    // Decaissement salaires (5 jours plus tard)
    const payDate = new Date(payrollDate.getTime() + 5 * 86_400_000)
    if (payDate <= endMonth) {
      const decNum = String(entryCounter++).padStart(6, "0")
      entries.push({
        journalCode: "BQ",
        journalLib: "Banque",
        ecritureNum: decNum,
        ecritureDate: payDate,
        compteNum: "421000",
        compteLib: "Personnel - remunerations dues",
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: `PAIE-${String(monthIdx + 1).padStart(2, "0")}`,
        pieceDate: payDate,
        ecritureLib: "Virement salaires",
        debit: Math.round(payrollTotal * 100) / 100,
        credit: 0,
      })
      entries.push({
        journalCode: "BQ",
        journalLib: "Banque",
        ecritureNum: decNum,
        ecritureDate: payDate,
        compteNum: "512000",
        compteLib: "Banque BNP Paribas",
        compAuxNum: "",
        compAuxLib: "",
        pieceRef: `PAIE-${String(monthIdx + 1).padStart(2, "0")}`,
        pieceDate: payDate,
        ecritureLib: "Virement salaires",
        debit: 0,
        credit: Math.round(payrollTotal * 100) / 100,
      })
    }
  }

  return entries
}

export function generateDemoFecText(): string {
  const headers = [
    "JournalCode",
    "JournalLib",
    "EcritureNum",
    "EcritureDate",
    "CompteNum",
    "CompteLib",
    "CompAuxNum",
    "CompAuxLib",
    "PieceRef",
    "PieceDate",
    "EcritureLib",
    "Debit",
    "Credit",
    "EcritureLet",
    "DateLet",
    "ValidDate",
    "Montantdevise",
    "Idevise",
  ]

  const rows: string[] = [headers.join("\t")]
  const entries = generateDemoEntries()
  for (const e of entries) {
    rows.push(
      [
        e.journalCode,
        e.journalLib,
        e.ecritureNum,
        dateStr(e.ecritureDate),
        e.compteNum,
        e.compteLib,
        e.compAuxNum,
        e.compAuxLib,
        e.pieceRef,
        dateStr(e.pieceDate),
        e.ecritureLib,
        fr(e.debit),
        fr(e.credit),
        "",
        "",
        dateStr(e.ecritureDate),
        "",
        "EUR",
      ].join("\t")
    )
  }
  return rows.join("\n")
}
