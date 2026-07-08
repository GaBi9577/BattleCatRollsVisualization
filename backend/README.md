# godfat_crawler

爬取 `bc.godfat.org` 轉蛋追蹤頁面的格子資料（位置 / 稀有度 / 貓咪名稱），
依 A / B 兩欄分開輸出成 JSON。

## 安裝

```bash
pip install -r requirements.txt
```

## 用法（命令列）

查詢轉蛋格子（`--event` 必填）：

```bash
python -m godfat_crawler.cli tracks \
    --seed 1131802308 \
    --event 2026-06-19_1046 \
    --lang tw \
    --output result.json
```

查詢 Upcoming 活動清單：

```bash
python -m godfat_crawler.cli events --lang tw --output events.json
```

輸出範例（`result.json`）：

```json
{
  "A": [
    { "position": "1A", "rarity": "uber", "name": "雙掌星西兒＆小毬" },
    { "position": "2A", "rarity": "normal", "name": "測試貓咪A2" }
  ],
  "B": [
    { "position": "1B", "rarity": "rare", "name": "測試貓咪B" }
  ]
}
```

輸出範例（`events.json`）：

```json
[
  {
    "value": "2026-04-24_1047",
    "date_range": "2026-04-24 ~ 2030-01-01",
    "title": "必出超激稀有角色的白金轉蛋！快來獲得心儀的貓咪吧！"
  }
]
```

## 用法（啟動後端 API）

```bash
uvicorn main:app --reload --port 8742
```

提供兩個端點：

| 端點 | 說明 |
|---|---|
| `GET /api/events?lang=tw` | Upcoming 活動清單，前端第 2 畫面下拉選單用 |
| `GET /api/tracks?seed=...&event=...&lang=tw` | 轉蛋格子資料（已依 A/B 分組） |

`event` 是 `/api/tracks` 的必填參數：不帶的話網站會自動帶入「目前精選」的活動，
不一定是使用者想模擬的那個，所以這裡刻意要求一定要先從 `/api/events` 選一個。

## 用法（當作 library 用，之後串 App / Web API）

```python
from godfat_crawler import (
    GodfatClient, PickCellParser, group_by_column, to_serializable,
    EventListParser, events_to_serializable,
)

client = GodfatClient()

# 先拿活動清單
events = EventListParser().parse_upcoming(client.fetch_event_list_page(lang="tw"))

# 用選定的 event 查轉蛋格子
html = client.fetch_track_page(seed="1131802308", event=events[0].value, lang="tw")
cells = PickCellParser().parse(html)
data = to_serializable(group_by_column(cells))
```

## 架構說明（SOLID）

| 模組 | 職責 |
|---|---|
| `models.py` | 定義 `PickCell`、`EventOption` 資料結構 |
| `fetcher.py` | 只負責發 HTTP request 拿 HTML（之後想換成讀本地檔案，只要換這個 class） |
| `parser.py` | 只負責把轉蛋格子頁面的 HTML 轉成 `PickCell` 清單 |
| `event_parser.py` | 只負責把活動清單頁面的 HTML 轉成 `EventOption` 清單（只取 Upcoming） |
| `grouper.py` | 只負責依 A/B 欄位分組 |
| `exporter.py` | 只負責轉成 JSON / 存檔 |
| `cli.py` | 命令列進入點，串接以上模組 |
| `main.py` | FastAPI 後端，把以上模組包成 Web API |

每個模組只做一件事（SRP），彼此用清楚的輸入輸出介接，
之後不管是要包進 Web API、改存 DB、或是換抓取來源，
都只要動對應的那個模組，不用動到其他部分。

## 已知限制

- `rarity` 的判斷邏輯改成「白名單比對」：依照網站本身公告的優先順序
  （`legend` > `found` > `exclusive` > `uber_fest`/`uber` > `supa_fest`/`supa` >
  `rare` > `normal`）去找 `<td>` 的 class 屬性裡有沒有比對到的稀有度字串，
  比對不到任何已知稀有度時 fallback 成 `"normal"`。
  這樣可以正確忽略 `owned`、`picked`、`picked_consecutively` 這些修飾用 class
  （例如 `class="uber owned"` 會正確判斷成 `uber`，不會誤判成 `owned`）。
- `normal`、`rare` 這兩個 class 名稱是推測的（網站官方說明只列出
  `supa`/`uber`/`legend`/`exclusive`/`found` 等「特殊」稀有度，沒提到一般/稀有），
  如果實測發現不是這兩個字串，把 `parser.py` 裡 `_RARITY_PRIORITY` 的對應項目改掉即可。
