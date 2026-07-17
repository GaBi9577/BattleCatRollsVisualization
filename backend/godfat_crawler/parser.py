"""負責把 HTML 解析成 PickCell 物件（含 R 格子）。"""
from __future__ import annotations

import logging
import re

from bs4 import BeautifulSoup, Tag

from .models import PickCell

logger = logging.getLogger(__name__)

_RARITY_PRIORITY = [
    "legend", "found", "exclusive",
    "uber_fest", "uber",
    "supa_fest", "supa",
    "rare", "normal",
]

_ONCLICK_PATTERN = re.compile(r"pick\('([^']+)'\)")

# 比對 span 裡的箭頭：-> 70B 或 <- 70B
# HTML entity -&gt; 會被 BeautifulSoup 自動解成 ->
_REDIRECT_PATTERN = re.compile(r"(->|<-)\s*(\w+)")


class PickCellParser:
    """單一職責：把一頁的 HTML 轉成 PickCell 清單（包含 R 格子，尚未合併）。"""

    def parse(self, html: str) -> list[PickCell]:
        soup = BeautifulSoup(html, "html.parser")
        cells = soup.select("td.cat.pick")
        if not cells:
            logger.warning(
                "解析頁面時找不到任何 td.cat.pick 格子，"
                "可能是網站格式改變或請求被擋，而不是活動本身沒有資料"
            )
        parsed = (self._parse_cell(cell) for cell in cells)
        return [cell for cell in parsed if cell is not None]

    def _parse_cell(self, cell: Tag) -> PickCell | None:
        raw_position = self._extract_position(cell)
        if not raw_position:
            logger.warning("格子的 onclick 屬性格式跟預期不符，找不到 position，已略過")
            return None

        is_r = raw_position.endswith("R")
        # 統一去掉 R 後綴儲存（合併時才能正確對應主格子）
        position = raw_position[:-1] if is_r else raw_position

        rarity = self._extract_rarity(cell)
        name = self._extract_name(cell)
        if not name:
            logger.warning("position=%s 的格子找不到貓咪名稱，已略過", position)
            return None

        # R 格子才抓 redirect
        redirect = self._extract_redirect(cell) if is_r else None

        return PickCell(
            position=position,
            rarity=rarity,
            name=name,
            # R 格子的名稱跟 redirect 先放在 alt_name/redirect，
            # 讓 merger 知道這是 R 格子
            alt_name=name if is_r else None,
            redirect=redirect,
        )

    @staticmethod
    def _extract_position(cell: Tag) -> str | None:
        onclick = cell.get("onclick", "")
        match = _ONCLICK_PATTERN.search(onclick)
        return match.group(1) if match else None

    @staticmethod
    def _extract_rarity(cell: Tag) -> str:
        classes = set(cell.get("class", []))
        for rarity in _RARITY_PRIORITY:
            if rarity in classes:
                return rarity
        return "normal"

    @staticmethod
    def _extract_name(cell: Tag) -> str | None:
        link = cell.select_one("span > a")
        return link.get_text(strip=True) if link else None

    @staticmethod
    def _extract_redirect(cell: Tag) -> str | None:
        span = cell.find("span")
        if not span:
            return None
        text = span.get_text()
        match = _REDIRECT_PATTERN.search(text)
        if not match:
            return None
        arrow, target = match.group(1), match.group(2)
        return f"{arrow}{target}"  # 例如 "->70B"
