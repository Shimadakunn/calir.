"""Render a side-by-side comparison of FEC_2024 vs FEC_2025 as a PNG chart."""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

ROOT = Path(__file__).resolve().parent.parent


def load(path: Path):
    """Returns: rev, exp, monthly_ca, monthly_purchases, journal_counts, balance_unbalanced."""
    rev = exp = 0.0
    monthly_ca = defaultdict(float)
    monthly_buy = defaultdict(float)
    journal_counts = defaultdict(int)
    sums = {}
    with path.open(encoding="utf-8") as f:
        next(f)
        for raw in f:
            ps = raw.strip().strip('"').split("|")
            d = float(ps[11].replace(",", ".") or 0)
            c = float(ps[12].replace(",", ".") or 0)
            month = int(ps[3][4:6])
            if ps[4].startswith("7"):
                rev += c - d
                monthly_ca[month] += c - d
            elif ps[4] == "607000":
                exp += d - c
                monthly_buy[month] += d - c
            elif ps[4].startswith("6"):
                exp += d - c
            journal_counts[ps[0]] += 1
            k = (ps[0], ps[2])
            s = sums.get(k, [0.0, 0.0])
            s[0] += d
            s[1] += c
            sums[k] = s
    unbal = sum(1 for v in sums.values() if abs(v[0] - v[1]) > 0.005)
    return rev, exp, monthly_ca, monthly_buy, journal_counts, len(sums), unbal


def main() -> None:
    rev24, exp24, ca24, buy24, jc24, nec24, ub24 = load(ROOT / "FEC_2024.csv")
    rev25, exp25, ca25, buy25, jc25, nec25, ub25 = load(ROOT / "FEC_2025.csv")

    fig, axes = plt.subplots(2, 2, figsize=(14, 9))
    fig.suptitle("FEC 2024 vs FEC 2025 simulé", fontsize=14, fontweight="bold")

    # 1. Monthly revenue comparison
    ax = axes[0, 0]
    months = list(range(1, 13))
    ca24_v = [ca24.get(m, 0) for m in months]
    ca25_v = [ca25.get(m, 0) for m in months]
    x = list(range(12))
    w = 0.4
    ax.bar([i - w/2 for i in x], ca24_v, w, label="2024", color="#94a3b8")
    ax.bar([i + w/2 for i in x], ca25_v, w, label="2025 simulé", color="#2563eb")
    ax.set_title("Chiffre d'affaires mensuel (€)")
    ax.set_xticks(x)
    ax.set_xticklabels(["J","F","M","A","M","J","J","A","S","O","N","D"])
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda v, _: f"{v/1000:,.0f}k"))
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    # 2. Monthly purchases comparison
    ax = axes[0, 1]
    buy24_v = [buy24.get(m, 0) for m in months]
    buy25_v = [buy25.get(m, 0) for m in months]
    ax.bar([i - w/2 for i in x], buy24_v, w, label="2024", color="#94a3b8")
    ax.bar([i + w/2 for i in x], buy25_v, w, label="2025 simulé", color="#16a34a")
    ax.set_title("Achats marchandises mensuels (€)")
    ax.set_xticks(x)
    ax.set_xticklabels(["J","F","M","A","M","J","J","A","S","O","N","D"])
    ax.yaxis.set_major_formatter(ticker.FuncFormatter(lambda v, _: f"{v/1000:,.0f}k"))
    ax.legend()
    ax.grid(axis="y", alpha=0.3)

    # 3. Lines per journal
    ax = axes[1, 0]
    journals = ["AN", "VE", "AC", "BQ", "OD"]
    v24 = [jc24.get(j, 0) for j in journals]
    v25 = [jc25.get(j, 0) for j in journals]
    x2 = list(range(len(journals)))
    ax.bar([i - w/2 for i in x2], v24, w, label="2024", color="#94a3b8")
    ax.bar([i + w/2 for i in x2], v25, w, label="2025 simulé", color="#9333ea")
    ax.set_title("Nombre de lignes par journal")
    ax.set_xticks(x2)
    ax.set_xticklabels(journals)
    ax.legend()
    ax.grid(axis="y", alpha=0.3)
    for i, (a, b) in enumerate(zip(v24, v25)):
        ax.text(i - w/2, a, str(a), ha="center", va="bottom", fontsize=8)
        ax.text(i + w/2, b, str(b), ha="center", va="bottom", fontsize=8)

    # 4. Indicators panel (text)
    ax = axes[1, 1]
    ax.axis("off")
    delta_ca = (rev25 - rev24) / rev24 * 100
    delta_exp = (exp25 - exp24) / exp24 * 100
    text = [
        ["", "2024", "2025"],
        ["Chiffre d'affaires", f"{rev24:>14,.0f} €", f"{rev25:>14,.0f} €"],
        ["Charges", f"{exp24:>14,.0f} €", f"{exp25:>14,.0f} €"],
        ["Résultat", f"{rev24-exp24:>14,.0f} €", f"{rev25-exp25:>14,.0f} €"],
        ["Écritures", f"{nec24:>14}", f"{nec25:>14}"],
        ["Lignes", f"{sum(jc24.values()):>14}", f"{sum(jc25.values()):>14}"],
        ["Écritures déséquilibrées", f"{ub24:>14}", f"{ub25:>14}"],
    ]
    table = ax.table(
        cellText=text,
        cellLoc="left",
        loc="upper left",
        colWidths=[0.45, 0.275, 0.275],
    )
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1.0, 1.7)
    for j in range(3):
        c = table[(0, j)]; c.set_facecolor("#1e293b"); c.set_text_props(color="white", weight="bold")
    for i in range(1, len(text)):
        for j in range(3):
            cell = table[(i, j)]
            cell.set_facecolor("#f8fafc" if i % 2 else "white")
            if j == 0: cell.set_text_props(weight="bold")
    ax.set_title("Indicateurs clés", pad=15)

    plt.tight_layout()
    out = ROOT / "FEC_2024_vs_2025.png"
    plt.savefig(out, dpi=150, bbox_inches="tight")
    print(f"Chart saved: {out}")


if __name__ == "__main__":
    main()
