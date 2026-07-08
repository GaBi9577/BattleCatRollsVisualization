"""負責把 PickCell 依欄位（A / B）分組。"""
from __future__ import annotations

from collections import defaultdict

from .models import PickCell


def group_by_column(cells: list[PickCell]) -> dict[str, list[PickCell]]:
    """把 PickCell 清單依 column（A / B）分開存放。

    例如 1A、2A 會被分到 "A"；1B、2B 會被分到 "B"。
    """
    grouped: dict[str, list[PickCell]] = defaultdict(list)
    for cell in cells:
        grouped[cell.column].append(cell)
    return dict(grouped)
