"""負責跟 bc.godfat.org 要頁面。"""
from __future__ import annotations

import requests

_BASE_URL = "https://bc.godfat.org/"

# 模擬瀏覽器 User-Agent，避免被伺服器判定為自動化請求而限速或拒絕
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


class GodfatClient:
    """單一職責：組網址、發送請求、回傳 HTML 字串。

    跟 Parser 分開，方便之後：
    - 測試 parser 時不用真的發 HTTP request（餵假 HTML 字串即可）
    - 換資料來源（例如改成讀本地存好的 HTML 檔）時，只要換掉這個 class
    """

    def __init__(self, timeout: float = 30.0):
        self._session = requests.Session()
        self._session.headers.update(_HEADERS)
        self._timeout = timeout

    def fetch_track_page(
        self,
        seed: str,
        event: str,
        lang: str = "tw",
        last: str | None = None,
    ) -> str:
        """抓「轉蛋格子」頁面。

        event 是必填：不帶 event 的話，網站會自動帶入「目前精選」的活動，
        不一定是使用者想模擬的那個活動，所以這裡刻意要求一定要傳。
        last 可省略，網站會自動補上。
        """
        params = {"seed": seed, "event": event, "lang": lang}
        if last is not None:
            params["last"] = last

        response = self._session.get(_BASE_URL, params=params, timeout=self._timeout)
        response.raise_for_status()
        return response.text

    def fetch_event_list_page(self, lang: str = "tw") -> str:
        """抓「活動清單」頁面（只需要 lang），用來解析可選的 event 清單。"""
        params = {"lang": lang}
        response = self._session.get(_BASE_URL, params=params, timeout=self._timeout)
        response.raise_for_status()
        return response.text
