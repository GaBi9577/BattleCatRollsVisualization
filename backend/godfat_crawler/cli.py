"""命令列進入點。

用法範例（查詢轉蛋格子，event 必填）：
    python -m godfat_crawler.cli tracks \
        --seed 1131802308 --event 2026-06-19_1046 --lang tw \
        --output result.json

用法範例（列出 Upcoming 活動清單）：
    python -m godfat_crawler.cli events --lang tw --output events.json
"""
from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from .event_parser import EventListParser
from .exporter import events_to_serializable, save_json
from .fetcher import GodfatClient
from .grouper import group_by_column
from .merger import merge_r_cells
from .parser import PickCellParser


def main() -> None:
    logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    args = _parse_args()
    if args.command == "tracks":
        _run_tracks(args)
    else:
        _run_events(args)


def _run_tracks(args: argparse.Namespace) -> None:
    html = GodfatClient().fetch_track_page(
        seed=args.seed, event=args.event, lang=args.lang, last=args.last
    )
    cells = PickCellParser().parse(html)
    cells = merge_r_cells(cells)
    grouped = group_by_column(cells)

    save_json(grouped, args.output)
    print(f"解析到 {len(cells)} 個格子，已輸出到 {args.output}")


def _run_events(args: argparse.Namespace) -> None:
    html = GodfatClient().fetch_event_list_page(lang=args.lang)
    events = EventListParser().parse_upcoming(html)
    data = events_to_serializable(events)

    Path(args.output).write_text(
        json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"解析到 {len(events)} 個 Upcoming 活動，已輸出到 {args.output}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="bc.godfat.org 爬蟲工具")
    subparsers = parser.add_subparsers(dest="command", required=True)

    tracks_parser = subparsers.add_parser("tracks", help="爬取轉蛋格子資料")
    tracks_parser.add_argument("--seed", required=True)
    tracks_parser.add_argument("--event", required=True)
    tracks_parser.add_argument("--lang", default="tw")
    tracks_parser.add_argument("--last", default=None)
    tracks_parser.add_argument("--output", default="result.json")

    events_parser = subparsers.add_parser("events", help="爬取 Upcoming 活動清單")
    events_parser.add_argument("--lang", default="tw")
    events_parser.add_argument("--output", default="events.json")

    return parser.parse_args()


if __name__ == "__main__":
    main()
