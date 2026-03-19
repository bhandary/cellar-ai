from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .providers import cellar_advice, food_pairing, price_check, wine_lookup

SYSTEM_PROMPT = (
    "You are Cellar AI, a polished wine expert assistant. "
    "Give sommelier-level guidance, explain your reasoning clearly, and present recommendations in a modern product tone."
)


@dataclass
class ToolSignal:
    name: str
    args: dict[str, Any]
    result: dict[str, Any]


@dataclass
class AgentTurn:
    text: str
    tool_signals: list[ToolSignal]
    state: dict[str, Any]


def latest_user_text(messages: list[dict[str, Any]]) -> str:
    for message in reversed(messages):
        if message.get("role") == "user":
            return str(message.get("content", "")).strip()
    return ""


def build_turn(messages: list[dict[str, Any]]) -> AgentTurn:
    prompt = latest_user_text(messages)
    if not prompt:
        return AgentTurn(
            text="Welcome to Cellar AI. Ask about a region, pairing, bottle recommendation, or cellar strategy.",
            tool_signals=[],
            state={"intent": "welcome"},
        )

    tools = [
        ToolSignal(name="wine_lookup", args={"query": prompt}, result=wine_lookup(prompt)),
        ToolSignal(name="food_pairing", args={"query": prompt}, result=food_pairing(prompt)),
        ToolSignal(name="price_check", args={"query": prompt}, result=price_check(prompt)),
        ToolSignal(name="cellar_advice", args={"query": prompt}, result=cellar_advice(prompt)),
    ]

    wine = tools[0].result["wine"]
    text = (
        f"For a polished recommendation, I’d start with {wine['name']} from {wine['region']}. "
        f"It highlights {', '.join(wine['tasting_notes'])}, pairs especially well with {wine['pairing']}, "
        f"and sits in a practical {wine['price_band']} range. I’ve also prepared a comparison view and cellar guidance inline."
    )
    return AgentTurn(text=text, tool_signals=tools, state={"intent": "recommendation", "region": wine["region"]})


def chunk_text(text: str) -> list[str]:
    words = text.split(" ")
    return [word + (" " if index < len(words) - 1 else "") for index, word in enumerate(words)]
