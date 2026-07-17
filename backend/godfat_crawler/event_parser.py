"""負責解析活動清單頁面（<select id="event_select"> 下拉選單），抓出 Upcoming 活動。"""
from __future__ import annotations

import logging
import re

from bs4 import BeautifulSoup, Tag

from .models import EventOption

logger = logging.getLogger(__name__)

# <option> 的文字長這樣： " 2026-04-24 ~ 2030-01-01: 必出超激稀有角色的白金轉蛋！..."
# 用日期區間當錨點，把日期跟標題切開（標題本身可能含冒號，所以不能用「第一個冒號切」）。
_DATE_TITLE_PATTERN = re.compile(
    r"^\s*(?P<date>\d{4}-\d{2}-\d{2}\s*~\s*\d{4}-\d{2}-\d{2})\s*:\s*(?P<title>.*)$",
    re.DOTALL,
)


class EventListParser:
    """單一職責：把活動清單頁面的 HTML 轉成 EventOption 清單（只取 Upcoming 分類）。"""

    UPCOMING_LABEL = "Upcoming:"

    def parse_upcoming(self, html: str) -> list[EventOption]:
        soup = BeautifulSoup(html, "html.parser")
        select = soup.find("select", id="event_select")
        if select is None:
            logger.warning(
                "找不到 id=event_select 的下拉選單，可能是網站格式改變或請求被擋"
            )
            return []

        optgroup = self._find_upcoming_optgroup(select)
        if optgroup is None:
            logger.warning(
                "找不到 label=%r 的 optgroup，可能是網站格式改變", self.UPCOMING_LABEL
            )
            return []

        options = optgroup.find_all("option")
        parsed = (self._parse_option(option) for option in options)
        return [event for event in parsed if event is not None]

    def _find_upcoming_optgroup(self, select: Tag) -> Tag | None:
        for optgroup in select.find_all("optgroup"):
            if optgroup.get("label", "").strip() == self.UPCOMING_LABEL:
                return optgroup
        return None

    @staticmethod
    def _parse_option(option: Tag) -> EventOption | None:
        value = option.get("value")
        text = option.get_text(strip=True)

        if not value or not text:
            logger.warning("活動選項缺少 value 或文字內容，已略過：%r", text)
            return None

        match = _DATE_TITLE_PATTERN.match(text)
        if not match:
            # 格式跟預期不一樣（理論上不該發生），跳過這筆，不讓整個解析掛掉。
            logger.warning("活動選項格式跟預期不符，已略過：%r", text)
            return None

        return EventOption(
            value=value,
            date_range=match.group("date").strip(),
            title=match.group("title").strip(),
        )
