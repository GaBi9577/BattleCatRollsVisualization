"""資料模型定義。"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass(frozen=True)
class PickCell:
    """代表頁面上一個可選的轉蛋格子（<td class="cat pick ...">）。

    R 欄位（例如 69AR）解析後會被合併進對應的主格子（69A），
    合併後 alt_name 與 redirect 會被填入。

    對應到範例 HTML（一般格子）：
        <td class="cat pick uber" onclick="pick('1A')">
            <span><a>雙掌星西兒＆小毬</a> <a>🐾</a></span>
        </td>

    對應到範例 HTML（R 格子，解析後合併進主格子）：
        <td class="cat pick rare" onclick="pick('69AR')">
            <span><a>發條貓</a> <a>🐾</a> -&gt; 70B</span>
        </td>
    """

    position: str           # 例如 "1A"、"69A"（已去除 R 後綴）
    rarity: str             # 例如 "uber"、"rare"
    name: str               # 主格子的貓咪名稱
    alt_name: str | None = field(default=None)    # R 格子的貓咪名稱（合併後填入）
    redirect: str | None = field(default=None)    # 例如 "->70B"（合併後填入）

    @property
    def column(self) -> str:
        """格子所屬欄位（A 或 B）。"""
        return self.position[-1]

    @property
    def row(self) -> str:
        """格子所屬列數。"""
        return self.position[:-1]

    @property
    def has_redirect(self) -> bool:
        return self.alt_name is not None


@dataclass(frozen=True)
class EventOption:
    """代表活動清單頁面 <select id="event_select"> 裡的一個 <option>。"""

    value: str       # 例如 "2026-04-24_1047"
    date_range: str  # 例如 "2026-04-24 ~ 2030-01-01"
    title: str       # 例如 "必出超激稀有角色的白金轉蛋！"
