"""輸出格式轉換：把解析結果轉成 JSON。

這個模組故意跟「怎麼抓資料」「怎麼解析」分開，
之後要包成 Web API 時，可以直接拿 to_serializable() 的結果丟給
FastAPI / Flask 的 jsonify，不用改動爬蟲邏輯本身。
"""
from __future__ import annotations

import json
from pathlib import Path

from .models import EventOption, PickCell

GroupedCells = dict[str, list[PickCell]]


def to_serializable(grouped: GroupedCells) -> dict:
    """把 {"A": [PickCell, ...], "B": [...]} 轉成純 dict/list，可直接 json.dumps。"""
    return {
        column: [
            {
                "position": cell.position,
                "rarity": cell.rarity,
                "name": cell.name,
                "alt_name": cell.alt_name,
                "redirect": cell.redirect,
            }
            for cell in cells
        ]
        for column, cells in grouped.items()
    }


def save_json(grouped: GroupedCells, path: str | Path) -> None:
    """把分組結果寫成 JSON 檔案（UTF-8，中文字不轉 \\u 跳脫）。"""
    data = to_serializable(grouped)
    Path(path).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def events_to_serializable(events: list[EventOption]) -> list[dict]:
    """把 EventOption 清單轉成純 list/dict，可直接 json.dumps。"""
    return [
        {"value": event.value, "date_range": event.date_range, "title": event.title}
        for event in events
    ]
