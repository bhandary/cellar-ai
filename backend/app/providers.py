from __future__ import annotations

from dataclasses import dataclass


@dataclass
class WineCard:
    name: str
    region: str
    grape: str
    vintage: str
    price_band: str
    tasting_notes: list[str]
    pairing: str
    cellar_window: str


MOCK_WINES = {
    "burgundy": WineCard(
        name="Domaine des Caves Pinot Noir",
        region="Burgundy, France",
        grape="Pinot Noir",
        vintage="2021",
        price_band="$45-$60",
        tasting_notes=["red cherry", "rose petal", "forest floor"],
        pairing="roast chicken and wild mushrooms",
        cellar_window="drink now through 2029",
    ),
    "rioja": WineCard(
        name="Bodega Alta Rioja Reserva",
        region="Rioja, Spain",
        grape="Tempranillo",
        vintage="2019",
        price_band="$28-$38",
        tasting_notes=["black plum", "cedar", "dried herbs"],
        pairing="lamb chops and paprika potatoes",
        cellar_window="drink now through 2030",
    ),
    "napa": WineCard(
        name="Summit Cellars Cabernet Sauvignon",
        region="Napa Valley, USA",
        grape="Cabernet Sauvignon",
        vintage="2020",
        price_band="$70-$95",
        tasting_notes=["blackcurrant", "cocoa", "graphite"],
        pairing="ribeye steak with rosemary butter",
        cellar_window="hold 2-3 years; peak through 2035",
    ),
}


def _pick_wine(query: str) -> WineCard:
    lowered = query.lower()
    for key, wine in MOCK_WINES.items():
        if key in lowered:
            return wine
    return next(iter(MOCK_WINES.values()))


def wine_lookup(query: str) -> dict:
    wine = _pick_wine(query)
    return {"type": "wine_card", "wine": wine.__dict__}


def food_pairing(query: str) -> dict:
    wine = _pick_wine(query)
    return {
        "type": "pairing_breakdown",
        "dish": wine.pairing,
        "why_it_works": [
            "acid balances richness",
            "fruit profile complements savory depth",
            "tannin or texture matches protein intensity",
        ],
    }


def price_check(query: str) -> dict:
    wine = _pick_wine(query)
    return {
        "type": "comparison_table",
        "columns": ["Wine", "Region", "Price Band", "Style"],
        "rows": [
            [wine.name, wine.region, wine.price_band, "Classic benchmark"],
            ["Alternative Estate Selection", wine.region, "$35-$50", "Better value pick"],
        ],
    }


def cellar_advice(query: str) -> dict:
    wine = _pick_wine(query)
    return {
        "type": "tasting_note_breakdown",
        "headline": f"Cellar advice for {wine.name}",
        "structure": {
            "fruit": wine.tasting_notes[0],
            "earth": wine.tasting_notes[-1],
            "oak": "moderate integration",
            "aging": wine.cellar_window,
        },
    }
