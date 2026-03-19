from __future__ import annotations

import asyncio
import json
import os
import time
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from .graph import SYSTEM_PROMPT, build_turn, chunk_text
from .models import HealthResponse, RunRequest

app = FastAPI(title="Cellar AI API", version="0.1.0")
provider_mode = os.getenv("CELLAR_AI_PROVIDER_MODE", "mock")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def new_id() -> str:
    return str(uuid4())


def timestamp_ms() -> int:
    return int(time.time() * 1000)


async def make_events(payload: RunRequest):
    turn = build_turn(payload.messages)
    assistant_message_id = new_id()
    events: list[dict] = [
        {"type": "RUN_STARTED", "threadId": payload.threadId, "runId": payload.runId, "timestamp": timestamp_ms()},
        {"type": "STEP_STARTED", "stepName": "wine_expert_turn", "timestamp": timestamp_ms()},
        {"type": "TEXT_MESSAGE_START", "messageId": assistant_message_id, "role": "assistant", "timestamp": timestamp_ms()},
        {
            "type": "STATE_SNAPSHOT",
            "messageId": assistant_message_id,
            "state": turn.state,
            "timestamp": timestamp_ms(),
        },
        {
            "type": "CUSTOM",
            "name": "PROVIDER_MODE",
            "value": {"mode": provider_mode},
            "timestamp": timestamp_ms(),
        },
    ]

    for tool in turn.tool_signals:
        tool_call_id = new_id()
        events.extend(
            [
                {
                    "type": "TOOL_CALL_START",
                    "toolCallId": tool_call_id,
                    "toolCallName": tool.name,
                    "parentMessageId": assistant_message_id,
                    "timestamp": timestamp_ms(),
                },
                {
                    "type": "TOOL_CALL_ARGS",
                    "toolCallId": tool_call_id,
                    "delta": json.dumps(tool.args),
                    "timestamp": timestamp_ms(),
                },
                {
                    "type": "TOOL_CALL_END",
                    "toolCallId": tool_call_id,
                    "timestamp": timestamp_ms(),
                },
                {
                    "type": "TOOL_CALL_RESULT",
                    "toolCallId": tool_call_id,
                    "content": json.dumps(tool.result),
                    "timestamp": timestamp_ms(),
                },
            ]
        )

    for delta in chunk_text(turn.text):
        events.append(
            {
                "type": "TEXT_MESSAGE_CONTENT",
                "messageId": assistant_message_id,
                "delta": delta,
                "timestamp": timestamp_ms(),
            }
        )

    events.extend(
        [
            {"type": "TEXT_MESSAGE_END", "messageId": assistant_message_id, "timestamp": timestamp_ms()},
            {"type": "STEP_FINISHED", "stepName": "wine_expert_turn", "timestamp": timestamp_ms()},
            {
                "type": "RUN_FINISHED",
                "threadId": payload.threadId,
                "runId": payload.runId,
                "result": {"system_prompt": SYSTEM_PROMPT, "provider_mode": provider_mode},
                "timestamp": timestamp_ms(),
            },
        ]
    )
    return events


async def sse_response(payload: RunRequest):
    async def event_generator():
        for item in await make_events(payload):
            yield {"data": json.dumps(item)}
            await asyncio.sleep(0)

    return EventSourceResponse(event_generator())


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="cellar-ai-backend", provider_mode=provider_mode)


@app.post("/run")
async def run(payload: RunRequest):
    return {"threadId": payload.threadId, "runId": payload.runId, "events": await make_events(payload)}


@app.post("/run_sse")
async def run_sse(payload: RunRequest):
    return await sse_response(payload)


@app.get("/")
def root():
    return JSONResponse({"service": "cellar-ai-backend", "provider_mode": provider_mode, "endpoints": ["/run", "/run_sse", "/health"]})
