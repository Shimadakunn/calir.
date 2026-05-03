"""Generate FEC_2025.csv simulating year 2025, based on patterns observed in FEC_2024.csv.

Design choices (vs the 2024 source):
- Same chart of accounts, same clients (CL001-CL012) and suppliers (FR001-FR007, FRB01).
- Same journals (AN, VE, AC, BQ, OD) and same labels.
- Opening balances = 2024 closing balance-sheet balances + 129000 carrying the prior loss.
- Fixes the unbalanced PAIE écritures of 2024: every payroll entry now balances using
  account 645100 (Cotisations à l'URSSAF, employer share).
- No arbitrary single-leg BAL entry; the trial balance closes naturally.
- ~+5% growth on sales/purchases volumes vs 2024 to simulate business expansion.
- Realistic seasonality copied from 2024 monthly counts.

Output: FEC_2025.csv next to FEC_2024.csv.
"""
from __future__ import annotations

import csv
import os
import random
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "FEC_2024.csv"
TARGET = ROOT / "FEC_2025.csv"

SEED = 20250101
TVA_RATE = 0.20
GROWTH = 1.05  # +5% on sales & purchases

CLIENTS = {
    "CL001": "HyperMarché Atlantique",
    "CL002": "Distrib Ouest",
    "CL003": "Supérette du Centre",
    "CL004": "Maison & Stock",
    "CL005": "Comptoir Horizon",
    "CL006": "Réseau Proxi Nord",
    "CL007": "Marché Express",
    "CL008": "Bazar Premium",
    "CL009": "Union Retail",
    "CL010": "NegoPlus",
    "CL011": "Centrale Commerce",
    "CL012": "Maison des Bonnes Affaires",
}

GOODS_SUPPLIERS = {
    "FR001": "Grossiste Alpha",
    "FR002": "Import Beta",
    "FR003": "Euro Négoce",
    "FR004": "Stock Delta",
    "FR005": "Fournitures Gamma",
}
TRANSPORT_SUPPLIER = ("FR007", "Transport LogiTrans")
SUPPLIES_SUPPLIER = ("FR006", "Packlog")
RENT_LANDLORD = ("FRB01", "SCI Entrepôts")

ACCOUNT_LABELS = {
    "101000": "Capital",
    "108000": "Compte de l'exploitant",
    "110000": "Report à nouveau",
    "129000": "Résultat de l'exercice (perte)",
    "164000": "Emprunts auprès des établissements de crédit",
    "207000": "Fonds commercial",
    "218300": "Matériel de bureau et informatique",
    "281830": "Amortissements matériel de bureau",
    "370000": "Stocks de marchandises",
    "401000": "Fournisseurs",
    "411000": "Clients",
    "421000": "Personnel - rémunérations dues",
    "431000": "Sécurité sociale",
    "442100": "Prélèvement à la source",
    "445510": "TVA à décaisser",
    "445660": "TVA déductible sur autres biens et services",
    "445670": "Crédit de TVA à reporter",
    "445710": "TVA collectée",
    "512000": "Banque",
    "603700": "Variation des stocks de marchandises",
    "606300": "Fournitures d'entretien et petit équipement",
    "607000": "Achats de marchandises",
    "613200": "Locations immobilières",
    "624100": "Transports sur achats",
    "641000": "Rémunérations du personnel",
    "645100": "Cotisations à l'URSSAF",
    "661100": "Intérêts des emprunts et dettes",
    "681120": "Dotations aux amortissements sur immobilisations corporelles",
    "707000": "Ventes de marchandises",
}

SALE_LABELS = [
    "Vente marchandises lot promotionnel",
    "Vente marchandises gamme standard",
    "Vente marchandises assortiment saisonnier",
    "Vente marchandises réassort mensuel",
]
PURCHASE_LABELS = [
    "Achat marchandises lot grossiste",
    "Achat marchandises import",
    "Achat marchandises réapprovisionnement",
    "Achat marchandises collection saisonnière",
]

# Monthly INVOICE counts (2024 had ~3 lines per invoice). Approx the 2024 counts × 1.05.
SALES_PER_MONTH = [47, 35, 37, 33, 41, 45, 42, 33, 28, 28, 37, 40]
PURCH_PER_MONTH = [25, 40, 35, 29, 37, 27, 32, 35, 40, 30, 26, 41]


@dataclass
class Line:
    journal: str
    journal_lib: str
    ecriture_num: int  # placeholder; rewritten at the end after sorting by date
    ecriture_date: date
    compte: str
    aux_num: str = ""
    aux_lib: str = ""
    piece_ref: str = ""
    piece_date: date | None = None
    label: str = ""
    debit: float = 0.0
    credit: float = 0.0
    valid_date: date | None = None

    def to_csv_row(self) -> str:
        d = lambda x: f"{x:.2f}".replace(".", ",")
        date_s = lambda dd: dd.strftime("%Y%m%d") if dd else ""
        fields = [
            self.journal,
            self.journal_lib,
            str(self.ecriture_num),
            date_s(self.ecriture_date),
            self.compte,
            ACCOUNT_LABELS[self.compte],
            self.aux_num,
            self.aux_lib,
            self.piece_ref,
            date_s(self.piece_date or self.ecriture_date),
            self.label,
            d(self.debit),
            d(self.credit),
            "",  # EcritureLet
            "",  # DateLet
            date_s(self.valid_date or self.ecriture_date),
            "",  # Montantdevise
            "",  # Idevise
        ]
        return '"' + "|".join(fields) + '"'


def read_2024_closing() -> dict[str, float]:
    """Sum debit-credit per account from FEC_2024.csv → returns balances."""
    bals: dict[str, float] = defaultdict(float)
    with SOURCE.open(encoding="utf-8") as f:
        next(f)
        for raw in f:
            raw = raw.strip().strip('"')
            parts = raw.split("|")
            d = float(parts[11].replace(",", ".") or 0)
            c = float(parts[12].replace(",", ".") or 0)
            bals[parts[4]] += d - c
    return bals


def round2(x: float) -> float:
    return round(x + 1e-9, 2)


def build_opening(bals: dict[str, float]) -> list[Line]:
    """Build AN entries (balance sheet only). The P&L difference becomes 129000."""
    bs_classes = {"1", "2", "3", "4", "5"}
    bs = {c: round2(v) for c, v in bals.items() if c[0] in bs_classes and abs(v) > 0.005}
    # P&L sum (D-C): positive = expenses > revenues = loss → debit on 129000
    pl_loss = round2(sum(v for c, v in bals.items() if c[0] in {"6", "7"}))
    bs["129000"] = pl_loss

    # Verify
    assert abs(sum(bs.values())) < 0.01, f"Opening unbalanced: {sum(bs.values())}"

    lines: list[Line] = []
    for compte in sorted(bs):
        v = bs[compte]
        debit = v if v > 0 else 0
        credit = -v if v < 0 else 0
        lines.append(
            Line(
                journal="AN",
                journal_lib="A-Nouveaux",
                ecriture_num=1,
                ecriture_date=date(2025, 1, 1),
                compte=compte,
                piece_ref="AN2025",
                label="A nouveaux 2025",
                debit=debit,
                credit=credit,
            )
        )
    return lines


def add_invoice(lines: list[Line], rng: random.Random, num: int, day: date, ht: float,
                client_id: str, label: str) -> None:
    ht = round2(ht)
    tva = round2(ht * TVA_RATE)
    ttc = round2(ht + tva)
    pid = client_id
    pname = CLIENTS[client_id]
    seq = f"VE2025{day.month:02d}{num:04d}"
    lines.append(Line("VE", "Ventes", 0, day, "411000", pid, pname, seq, day, label, ttc, 0))
    lines.append(Line("VE", "Ventes", 0, day, "445710", "", "", seq, day, label, 0, tva))
    lines.append(Line("VE", "Ventes", 0, day, "707000", "", "", seq, day, label, 0, ht))


def add_purchase_goods(lines: list[Line], rng: random.Random, num: int, day: date,
                       ht: float, sup_id: str, label: str) -> None:
    ht = round2(ht)
    tva = round2(ht * TVA_RATE)
    ttc = round2(ht + tva)
    sname = GOODS_SUPPLIERS[sup_id]
    seq = f"AC2025{day.month:02d}{num:04d}"
    lines.append(Line("AC", "Achats", 0, day, "401000", sup_id, sname, seq, day, label, 0, ttc))
    lines.append(Line("AC", "Achats", 0, day, "445660", "", "", seq, day, label, tva, 0))
    lines.append(Line("AC", "Achats", 0, day, "607000", "", "", seq, day, label, ht, 0))


def add_purchase_transport(lines: list[Line], num: int, day: date, ht: float) -> None:
    ht = round2(ht)
    tva = round2(ht * TVA_RATE)
    ttc = round2(ht + tva)
    sup_id, sname = TRANSPORT_SUPPLIER
    seq = f"TR2025{day.month:02d}{num:03d}"
    label = "Facture transport marchandises"
    lines.append(Line("AC", "Achats", 0, day, "401000", sup_id, sname, seq, day, label, 0, ttc))
    lines.append(Line("AC", "Achats", 0, day, "445660", "", "", seq, day, label, tva, 0))
    lines.append(Line("AC", "Achats", 0, day, "624100", "", "", seq, day, label, ht, 0))


def add_purchase_supplies(lines: list[Line], num: int, day: date, ht: float) -> None:
    ht = round2(ht)
    tva = round2(ht * TVA_RATE)
    ttc = round2(ht + tva)
    sup_id, sname = SUPPLIES_SUPPLIER
    seq = f"FG2025{day.month:02d}{num:03d}"
    label = "Frais généraux et fournitures"
    lines.append(Line("AC", "Achats", 0, day, "401000", sup_id, sname, seq, day, label, 0, ttc))
    lines.append(Line("AC", "Achats", 0, day, "445660", "", "", seq, day, label, tva, 0))
    lines.append(Line("AC", "Achats", 0, day, "606300", "", "", seq, day, label, ht, 0))


def add_rent(lines: list[Line], month: int) -> None:
    """Monthly rent (5th of month). 2,800 € HT → 3,360 € TTC."""
    day = date(2025, month, 5)
    ht = 2800.0
    tva = round2(ht * TVA_RATE)
    ttc = round2(ht + tva)
    sup_id, sname = RENT_LANDLORD
    seq = f"LOY2025{month:02d}"
    label = "Loyer entrepôt et bureaux"
    lines.append(Line("OD", "Opérations diverses", 0, day, "401000", sup_id, sname, seq, day, label, 0, ttc))
    lines.append(Line("OD", "Opérations diverses", 0, day, "445660", "", "", seq, day, label, tva, 0))
    lines.append(Line("OD", "Opérations diverses", 0, day, "613200", "", "", seq, day, label, ht, 0))


def add_payroll(lines: list[Line], month: int, rng: random.Random) -> None:
    """Monthly payroll (26th). Properly balanced with 645100 (employer SS)."""
    day = date(2025, month, 26)
    gross = round(rng.uniform(18800, 20000), 2)
    employer_ss_rate = 0.42  # ~42% on top of gross — typical FR average
    employer_ss = round2(gross * employer_ss_rate)
    employee_ss = round2(gross * 0.22)
    pas = round2(gross * 0.10)
    net = round2(gross - employee_ss - pas)
    total_ss = round2(employee_ss + employer_ss)
    seq = f"PAIE2025{month:02d}"
    label = "Constatation paie mensuelle"
    lines.append(Line("OD", "Opérations diverses", 0, day, "421000", "", "", seq, day, label, 0, net))
    lines.append(Line("OD", "Opérations diverses", 0, day, "431000", "", "", seq, day, label, 0, total_ss))
    lines.append(Line("OD", "Opérations diverses", 0, day, "442100", "", "", seq, day, label, 0, pas))
    lines.append(Line("OD", "Opérations diverses", 0, day, "641000", "", "", seq, day, label, gross, 0))
    lines.append(Line("OD", "Opérations diverses", 0, day, "645100", "", "", seq, day, label, employer_ss, 0))


def add_salary_payment(lines: list[Line], month: int, rng: random.Random,
                       net: float, total_ss: float, pas: float) -> None:
    """Pay salary + URSSAF/PAS at end of month (28th typically)."""
    pay_day = date(2025, month, 28)
    seq_sal = f"VIRPAIE2025{month:02d}"
    lines.append(Line("BQ", "Banque", 0, pay_day, "421000", "", "", seq_sal, pay_day,
                      "Paiement des salaires", net, 0))
    lines.append(Line("BQ", "Banque", 0, pay_day, "512000", "", "", seq_sal, pay_day,
                      "Paiement des salaires", 0, net))
    seq_urs = f"URSSAF2025{month:02d}"
    total = round2(total_ss + pas)
    lines.append(Line("BQ", "Banque", 0, pay_day, "431000", "", "", seq_urs, pay_day,
                      "Paiement charges sociales", total_ss, 0))
    lines.append(Line("BQ", "Banque", 0, pay_day, "442100", "", "", seq_urs, pay_day,
                      "Paiement charges sociales", pas, 0))
    lines.append(Line("BQ", "Banque", 0, pay_day, "512000", "", "", seq_urs, pay_day,
                      "Paiement charges sociales", 0, total))


def add_loan_repayment(lines: list[Line], month: int) -> None:
    """Monthly loan repayment around 10th of month."""
    day = date(2025, month, 10)
    principal = 833.33  # ~10k/year
    interest = round2(833.33 * 0.20)  # decreasing in real life; here flat for simplicity
    total = round2(principal + interest)
    seq = f"PRET2025{month:02d}"
    label = "Remboursement emprunt + intérêts"
    lines.append(Line("BQ", "Banque", 0, day, "164000", "", "", seq, day, label, principal, 0))
    lines.append(Line("BQ", "Banque", 0, day, "661100", "", "", seq, day, label, interest, 0))
    lines.append(Line("BQ", "Banque", 0, day, "512000", "", "", seq, day, label, 0, total))


def main() -> None:
    rng = random.Random(SEED)
    bals_2024 = read_2024_closing()
    lines: list[Line] = []

    # 1. Opening AN
    lines.extend(build_opening(bals_2024))

    # 2. Sales by month
    sale_counters: dict[int, int] = defaultdict(int)
    invoice_index: list[tuple[date, str, float]] = []  # for matching bank receipts
    for month in range(1, 13):
        n = SALES_PER_MONTH[month - 1]
        for _ in range(n):
            sale_counters[month] += 1
            num = sale_counters[month]
            day_in_month = rng.randint(1, 28)
            d = date(2025, month, day_in_month)
            ht = round(rng.uniform(500, 8000) * GROWTH, 2)
            client = rng.choice(list(CLIENTS))
            label = rng.choice(SALE_LABELS)
            add_invoice(lines, rng, num, d, ht, client, label)
            invoice_index.append((d, client, round2(ht * (1 + TVA_RATE))))

    # 3. Purchases by month (goods + occasional transport + supplies)
    purchase_counters = defaultdict(int)
    transport_counters = defaultdict(int)
    supplies_counters = defaultdict(int)
    bills_index: list[tuple[date, str, float]] = []
    for month in range(1, 13):
        n = PURCH_PER_MONTH[month - 1]
        for _ in range(n):
            day_in_month = rng.randint(1, 28)
            d = date(2025, month, day_in_month)
            roll = rng.random()
            if roll < 0.85:
                purchase_counters[month] += 1
                num = purchase_counters[month]
                ht = round(rng.uniform(800, 8500) * GROWTH, 2)
                sup = rng.choice(list(GOODS_SUPPLIERS))
                label = rng.choice(PURCHASE_LABELS)
                add_purchase_goods(lines, rng, num, d, ht, sup, label)
                bills_index.append((d, sup, round2(ht * (1 + TVA_RATE))))
            elif roll < 0.93:
                transport_counters[month] += 1
                num = transport_counters[month]
                ht = round(rng.uniform(700, 2200), 2)
                add_purchase_transport(lines, num, d, ht)
                bills_index.append((d, TRANSPORT_SUPPLIER[0], round2(ht * (1 + TVA_RATE))))
            else:
                supplies_counters[month] += 1
                num = supplies_counters[month]
                ht = round(rng.uniform(300, 1800), 2)
                add_purchase_supplies(lines, num, d, ht)
                bills_index.append((d, SUPPLIES_SUPPLIER[0], round2(ht * (1 + TVA_RATE))))

    # 4. Bank receipts (clear ~93% of invoices within 15-50 days)
    bq_counter = 0
    for inv_date, client, ttc in invoice_index:
        if rng.random() > 0.93:
            continue  # leave some receivables open at year end
        delay = rng.randint(15, 50)
        pay_day = inv_date + timedelta(days=delay)
        if pay_day.year != 2025:
            pay_day = date(2025, 12, min(28, pay_day.day))
        bq_counter += 1
        seq = f"RBQ2025{pay_day.month:02d}{bq_counter:05d}"
        label = f"Règlement client {CLIENTS[client]}"
        lines.append(Line("BQ", "Banque", 0, pay_day, "411000", client, CLIENTS[client], seq, pay_day, label, 0, ttc))
        lines.append(Line("BQ", "Banque", 0, pay_day, "512000", "", "", seq, pay_day, label, ttc, 0))

    # 5. Bank payments (clear ~93% of bills within 25-55 days)
    for bill_date, sup, ttc in bills_index:
        if rng.random() > 0.93:
            continue
        delay = rng.randint(25, 55)
        pay_day = bill_date + timedelta(days=delay)
        if pay_day.year != 2025:
            pay_day = date(2025, 12, min(28, pay_day.day))
        bq_counter += 1
        seq = f"PBQ2025{pay_day.month:02d}{bq_counter:05d}"
        sup_name = (
            CLIENTS.get(sup)
            or GOODS_SUPPLIERS.get(sup)
            or {TRANSPORT_SUPPLIER[0]: TRANSPORT_SUPPLIER[1],
                SUPPLIES_SUPPLIER[0]: SUPPLIES_SUPPLIER[1]}.get(sup)
        )
        label = f"Règlement fournisseur {sup_name}"
        lines.append(Line("BQ", "Banque", 0, pay_day, "401000", sup, sup_name, seq, pay_day, label, ttc, 0))
        lines.append(Line("BQ", "Banque", 0, pay_day, "512000", "", "", seq, pay_day, label, 0, ttc))

    # 6. Recurring OD: rent, payroll, loan, salary payment
    for month in range(1, 13):
        add_rent(lines, month)
        # snapshot RNG state so add_salary_payment uses same random gross
        # We record the figures by running add_payroll first and reading them out:
        before = len(lines)
        add_payroll(lines, month, rng)
        net = lines[before].credit
        total_ss = lines[before + 1].credit
        pas = lines[before + 2].credit
        add_salary_payment(lines, month, rng, net, total_ss, pas)
        add_loan_repayment(lines, month)

    # 6.5 Régularisation N-1: clear the 2024 carry-forward on 445660/445710 into 445670
    #     (the prior Q4 declaration is filed in January 2025, so this lands on Jan 21).
    open_445660 = round2(bals_2024.get("445660", 0))  # debit balance
    open_445710 = round2(-bals_2024.get("445710", 0))  # credit magnitude
    if abs(open_445660) > 0.005 or abs(open_445710) > 0.005:
        reg_day = date(2025, 1, 21)
        seq = "TVA2025REG"
        label = "Régularisation TVA exercice N-1"
        plug_445670 = round2(open_445660 - open_445710)  # net to credit reportable
        lines.append(Line("OD", "Opérations diverses", 0, reg_day, "445710", "", "", seq, reg_day, label, open_445710, 0))
        lines.append(Line("OD", "Opérations diverses", 0, reg_day, "445660", "", "", seq, reg_day, label, 0, open_445660))
        lines.append(Line("OD", "Opérations diverses", 0, reg_day, "445670", "", "", seq, reg_day, label, plug_445670, 0))

    # 7. Quarterly TVA declaration (21st of month following quarter end)
    # We compute period TVA collected vs deductible from current lines so it self-balances.
    quarter_ends = [(3, 21), (6, 21), (9, 21), (12, 21)]
    quarter_starts = [date(2025, 1, 1), date(2025, 4, 1), date(2025, 7, 1), date(2025, 10, 1)]
    for i, (m, d) in enumerate(quarter_ends):
        decl_day = date(2025, m, d)
        start = quarter_starts[i]
        end = decl_day
        col = 0.0
        ded = 0.0
        for L in lines:
            if L.journal == "AN":
                continue
            # Skip prior TVA OD entries (régularisation N-1 + previous closings) — they
            # are balance reversals, not new business movement to declare.
            if L.piece_ref.startswith("TVA"):
                continue
            if start <= L.ecriture_date <= end:
                if L.compte == "445710":
                    col += L.credit - L.debit
                elif L.compte == "445660":
                    ded += L.debit - L.credit
        # Avoid double-counting in next quarters: subtract amounts of prior TVA entries
        # (we only add new TVA OD entries inside this loop, and they reset 445710/445660)
        col = round2(col)
        ded = round2(ded)
        net = round2(col - ded)
        seq = f"TVA2025{m:02d}"
        label = "Déclaration TVA à décaisser"
        if net > 0:
            # Owe TVA to State
            lines.append(Line("OD", "Opérations diverses", 0, decl_day, "445710", "", "", seq, decl_day, label, col, 0))
            lines.append(Line("OD", "Opérations diverses", 0, decl_day, "445660", "", "", seq, decl_day, label, 0, ded))
            lines.append(Line("OD", "Opérations diverses", 0, decl_day, "445510", "", "", seq, decl_day, label, 0, net))
            # Pay it 10 days later
            pay_day = decl_day + timedelta(days=10)
            if pay_day.year != 2025:
                pay_day = date(2025, 12, 31)
            seq_pay = f"TVAPAY2025{m:02d}"
            lines.append(Line("BQ", "Banque", 0, pay_day, "445510", "", "", seq_pay, pay_day,
                              "Paiement TVA à l'État", net, 0))
            lines.append(Line("BQ", "Banque", 0, pay_day, "512000", "", "", seq_pay, pay_day,
                              "Paiement TVA à l'État", 0, net))
        else:
            # Crédit de TVA
            credit_amount = -net
            lines.append(Line("OD", "Opérations diverses", 0, decl_day, "445710", "", "", seq, decl_day, label, col, 0))
            lines.append(Line("OD", "Opérations diverses", 0, decl_day, "445660", "", "", seq, decl_day, label, 0, ded))
            lines.append(Line("OD", "Opérations diverses", 0, decl_day, "445670", "", "", seq, decl_day, label, credit_amount, 0))

    # 8. Year-end OD: stock variation + depreciation
    yearend = date(2025, 12, 31)
    stock_var = round(rng.uniform(8000, 15000), 2)
    lines.append(Line("OD", "Opérations diverses", 0, yearend, "370000", "", "", "INV2025", yearend,
                      "Variation de stock marchandises", stock_var, 0))
    lines.append(Line("OD", "Opérations diverses", 0, yearend, "603700", "", "", "INV2025", yearend,
                      "Variation de stock marchandises", 0, stock_var))

    depr = 2400.00
    lines.append(Line("OD", "Opérations diverses", 0, yearend, "281830", "", "", "AMO2025", yearend,
                      "Dotation aux amortissements", 0, depr))
    lines.append(Line("OD", "Opérations diverses", 0, yearend, "681120", "", "", "AMO2025", yearend,
                      "Dotation aux amortissements", depr, 0))

    # 9. Sort by date then journal then sequence ref, assign EcritureNum globally per écriture.
    #    Group consecutive lines that share (journal, piece_ref, ecriture_date).
    lines.sort(key=lambda L: (L.ecriture_date, L.journal, L.piece_ref))
    seen: dict[tuple[str, str, date], int] = {}
    next_num = 1
    for L in lines:
        if L.journal == "AN":
            L.ecriture_num = 1
            continue
        key = (L.journal, L.piece_ref, L.ecriture_date)
        if key not in seen:
            seen[key] = next_num
            next_num += 1
        L.ecriture_num = seen[key]

    # 10. Write to CSV
    with TARGET.open("w", encoding="utf-8", newline="") as f:
        f.write(
            "JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|"
            "CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|"
            "EcritureLet|DateLet|ValidDate|Montantdevise|Idevise\n"
        )
        for L in lines:
            f.write(L.to_csv_row() + "\n")

    print(f"Wrote {TARGET} ({len(lines)} lines, {next_num - 1} écritures + 1 AN)")


if __name__ == "__main__":
    main()
