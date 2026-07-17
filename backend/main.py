"""FastAPI 入口：把 godfat_crawler 包成 Web API。

啟動方式：
    uvicorn main:app --reload --port 8742
"""
from __future__ import annotations

from functools import lru_cache

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from godfat_crawler import (
    EventListParser,
    GodfatClient,
    PickCellParser,
    events_to_serializable,
    group_by_column,
    merge_r_cells,
    to_serializable,
)

app = FastAPI(title="Godfat Crawler API")

# 開發環境先全部開放；正式上線時請改成白名單前端網域。
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_client = GodfatClient()
_pick_parser = PickCellParser()
_event_parser = EventListParser()


@app.get("/api/events")
def get_events(lang: str = Query("tw", description="介面語言")):
    """回傳 Upcoming 活動清單，給前端第 2 畫面的下拉選單用。"""
    try:
        html = _client.fetch_event_list_page(lang=lang)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"無法連線到 bc.godfat.org：{exc}") from exc

    events = _event_parser.parse_upcoming(html)
    return events_to_serializable(events)


@app.get("/api/tracks")
def get_tracks(
    seed: str = Query(..., description="轉蛋種子"),
    event: str = Query(..., description="活動代碼（從 /api/events 選出的 value）"),
    lang: str = Query("tw", description="介面語言"),
):
    """回傳轉蛋格子資料，已依 A/B 欄位分組（同組 seed+event+lang 走 in-memory 快取）。"""
    try:
        return _get_tracks_cached(seed=seed, event=event, lang=lang)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"無法連線到 bc.godfat.org：{exc}") from exc


@lru_cache(maxsize=256)
def _get_tracks_cached(seed: str, event: str, lang: str):
    """實際抓取 + 解析，依 (seed, event, lang) 快取。seed+event+lang 是決定性的，
    結果不會變，成功的查詢會一直留在快取直到程序重啟或超過 maxsize 被 LRU 淘汰；
    失敗（RequestException）不會被快取，下次會重新嘗試連線。"""
    html = _client.fetch_track_page(seed=seed, event=event, lang=lang)
    cells = _pick_parser.parse(html)
    cells = merge_r_cells(cells)
    return to_serializable(group_by_column(cells))


@app.get("/api/health")
def health():
    return {"status": "ok"}
