"""負責把 R 格子合併進對應的主格子。

R 格子（例如 69AR，解析後 position 為 "69A"，且 alt_name 不為 None）
代表「如果選了 69A，下一抽的替代軌道會跳到 redirect 指定的位置」。
合併後：
- 主格子（69A）的 alt_name = R 格子的名稱
- 主格子（69A）的 redirect = R 格子的 redirect（例如 "->70B"）
- R 格子本身從清單移除
"""
from __future__ import annotations

from .models import PickCell


def merge_r_cells(cells: list[PickCell]) -> list[PickCell]:
    """把 R 格子合併進對應的主格子，並移除 R 格子本身。"""
    # 先建一個 position → 主格子 的 dict（R 格子的 alt_name 不為 None，可以此區分）
    main: dict[str, PickCell] = {}
    r_cells: list[PickCell] = []

    for cell in cells:
        if cell.alt_name is not None:
            # 這是 R 格子（parser 解析時 alt_name == name）
            r_cells.append(cell)
        else:
            main[cell.position] = cell

    # 把 R 格子的資訊寫進對應的主格子
    for r in r_cells:
        base = main.get(r.position)
        if base is None:
            # 沒有對應的主格子（理論上不該發生），直接略過
            continue
        main[r.position] = PickCell(
            position=base.position,
            rarity=base.rarity,
            name=base.name,
            alt_name=r.alt_name,
            redirect=r.redirect,
        )

    # 保持原始順序（只輸出主格子，R 格子已被合併移除）
    seen: set[str] = set()
    result: list[PickCell] = []
    for cell in cells:
        if cell.alt_name is not None:
            continue  # 跳過 R 格子
        if cell.position not in seen:
            seen.add(cell.position)
            result.append(main.get(cell.position, cell))

    return result
