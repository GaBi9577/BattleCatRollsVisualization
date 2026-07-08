# Battle Cats 轉蛋查詢工具 — 專案進度總結

## 1. 專案目標與核心功能

- 輸入 `seed` + 選擇語言，去 `bc.godfat.org` 爬取轉蛋模擬結果
- 呈現 A / B 兩欄的轉蛋格子（position、rarity、cat name）
- 支援多個活動（event）切換查看，並在背景預先快取所有 event 的結果
- 高稀有度格子（超激稀有、超激稀有限定、傳說稀有）hover 時，顯示其他 event 在同一格的貓咪是誰（tooltip 依貓咪名稱分組）

---

## 2. 技術棧與主要架構

### Backend（Python）

| 技術 | 用途 |
|---|---|
| Python 3.10+ | 主語言 |
| `requests` | 發 HTTP request 抓 bc.godfat.org HTML |
| `beautifulsoup4` | 解析 HTML，擷取格子資料 |
| `FastAPI` | 把爬蟲包成 Web API |
| `uvicorn` | FastAPI 的 ASGI 伺服器 |

### Frontend（JavaScript）

| 技術 | 用途 |
|---|---|
| React 18 | UI 框架 |
| Vite 5 | 開發伺服器 / 打包工具 |
| CSS（自訂 vars） | 深色主題樣式 |

---

## 3. 已完成的進度與檔案結構

### 後端 `backend/`

```
backend/
├── main.py                          # FastAPI 入口，提供兩個 API endpoint
├── requirements.txt                 # requests, beautifulsoup4, fastapi, uvicorn
├── README.md
└── godfat_crawler/
    ├── __init__.py                  # 套件對外介面
    ├── models.py                    # PickCell、EventOption dataclass
    ├── fetcher.py                   # GodfatClient：HTTP 請求，帶 browser User-Agent，timeout=30s
    ├── parser.py                    # PickCellParser：解析轉蛋格子（含 R 格子：alt_name、redirect）
    ├── event_parser.py              # EventListParser：解析 Upcoming event 清單
    ├── merger.py                    # merge_r_cells：把 R 格子合併進主格子
    ├── grouper.py                   # group_by_column：依 A/B 欄位分組
    └── exporter.py                  # to_serializable、events_to_serializable、save_json
```

**API endpoints：**

- `GET /api/events?lang=tw` → Upcoming 活動清單（`[{value, date_range, title}]`）
- `GET /api/tracks?seed=...&event=...&lang=tw` → A/B 分組的格子資料
- `GET /api/health` → `{"status": "ok"}`

**R 格子邏輯：**
- `69AR` → position 去掉 R 後綴存為 `69A`，`alt_name`（R 格子的貓）和 `redirect`（如 `->70B`）合併進主格子
- 解析流程：`parse()` → `merge_r_cells()` → `group_by_column()` → `to_serializable()`

**稀有度白名單（優先順序）：**
`legend > found > exclusive > uber_fest > uber > supa_fest > supa > rare > normal`
（比對 `<td>` 的 class，比對不到就 fallback 成 `normal`）

---

### 前端 `frontend/`

```
frontend/
├── index.html
├── package.json                     # React 18 + Vite 5
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx                      # 三個畫面狀態管理 + 背景抓取邏輯
    ├── styles.css                   # 深色主題樣式
    ├── api/
    │   └── godfatApi.js             # fetchUpcomingEvents、fetchTracks（預設指向 http://localhost:8742）
    ├── utils/
    │   ├── urlParser.js             # parseGodfatUrl：從 URL 解析 seed、lang
    │   └── eventComparison.js       # getOtherEventsForPosition、groupTooltipByName
    └── components/
        ├── UrlImportForm.jsx        # 貼網址解析（第 1 畫面）
        ├── SeedQueryForm.jsx        # 手動輸入 seed + lang（第 1 畫面）
        ├── EventSelect.jsx          # 選活動下拉選單（第 2 畫面），帶 onEventsLoaded callback
        ├── ResultColumns.jsx        # A/B 雙欄格子，產生 getTooltipData 往下傳
        └── PickCard.jsx             # 單一格子卡片 + hover tooltip
```

**三個畫面流程：**
1. **QUERY**：貼網址解析 seed/lang，或手動輸入，按查詢
2. **EVENT**：打 `/api/events` 載入活動清單，選一個活動
3. **RESULT**：優先抓選定 event 並顯示，背景依序（每隔 1 秒）抓其餘 event 並快取；頂部有活動切換選單，已快取的選項顯示 `✓`；所有 event 快取完成後，hover 高稀有格子顯示 tooltip

**格子卡片排版（PickCard）：**
```
┌──────────────────────────────────┐
│ 1A    貓咪1                      │
│ 稀有  貓咪2(->2A)（如有 R 格子）  │
└──────────────────────────────────┘
```
左欄：位置（上）+ 稀有度（下）；右欄：主格子名稱（上）+ R 格子名稱+箭頭（下）；沒有 R 格子時右欄名稱垂直置中

**稀有度顏色：**
| class | 顏色 |
|---|---|
| `normal` / `rare` | `transparent`（無底色） |
| `supa` | 亮黃 `#FFD700` |
| `supa_fest` | 橘黃 `#FFA500` |
| `uber` | 紅 `#FF3333` |
| `uber_fest` | 橘紅 `#FF6B35` |
| `exclusive` | 青 `#00FFFF` |
| `found` | 亮綠 `#00FF7F` |
| `legend` | 洋紅 `#FF00FF` |

**Tooltip（僅 `legend`、`uber`、`uber_fest`，且所有 event 都快取完成後才顯示）：**
- 依貓咪名稱分組，同名的多個 event 並列在同一個貓咪名稱下方
- 格式：名稱（上）+ 完整 event 標籤（`date_range：title`，下）

---

### 啟動腳本 `start.bat`（Windows）

放在 `godfat_app/` 根目錄，雙擊執行：
- 後端背景執行（`start /B`，不開新視窗），output 寫入 `backend.log`
- 前端在同一個視窗跑（`npm run dev`）
- 5 秒後自動開瀏覽器
- 關掉前端（`Ctrl+C`）後自動 kill 後端

> ✅ `start.bat` 已重新建立為單一視窗版本：
> - 後端以 `powershell Start-Process -WindowStyle Hidden` 在背景啟動（`uvicorn`，port `8742`），輸出寫入 `backend.log`，PID 寫入 `.backend.pid`
> - 前端 `npm run dev` 在同一視窗前景執行（Vite port `5742`，設定於 `vite.config.js`）
> - 背景延遲 5 秒後用 PowerShell `Start-Process` 自動開瀏覽器
> - 在視窗按 `Ctrl+C` 停掉前端後，會自動用 PID 檔案 `taskkill` 關閉背景後端
> `godfatApi.js`、`vite.config.js`、`main.py`、各 `README.md` 的 port 已全部同步改為 `8742` / `5742`。

---

## 4. 接下來要解決的問題 / 下一步計畫

### 未完成項目

（`start.bat` 單一視窗化、`godfatApi.js` port 對齊已完成，見上方「啟動腳本」小節）

### 已知限制 / 潛在問題

- bc.godfat.org 跨境連線偶爾 timeout（已將 timeout 調到 30 秒，並加上 browser User-Agent）
- 背景抓取每個 event 間隔 1 秒，10~20 個 event 約需 10~20 秒才能全部快取完
- Tooltip 的 `position: absolute; left: calc(100% + 8px)` 在 B 欄右側可能超出螢幕邊界，尚未處理右側溢出自動翻轉

### 可能的後續功能

- 多語言支援（目前只有 `lang=tw`，`SeedQueryForm` 的 `SUPPORTED_LANGS` 已預留擴充點）
- 結果頁面加上搜尋/篩選功能（依稀有度篩選格子）
- 快取持久化（目前關掉頁面就消失，考慮存 sessionStorage，但需先在 Vite dev 環境外測試）

---

## 5. 格式要求與開發規範

### 編碼原則

遵守 **SOLID / DRY / KISS / YAGNI**：
- 每個模組/元件只做一件事（SRP）
- 後端模組互不依賴，透過清楚的輸入輸出介接
- 前端元件不直接存取 cache/events，透過 `App.jsx` 或 props 往下傳

### 後端規範

- 新增稀有度：改 `parser.py` 的 `_RARITY_PRIORITY`
- 新增結構用 class（不是稀有度）：目前改用白名單比對，只要確認不在 `_RARITY_PRIORITY` 裡就不會被誤判
- Fetcher 的 User-Agent 已設定為 Chrome，若網站封鎖需再調整

### 前端規範

- 新增語言：在 `SeedQueryForm.jsx` 的 `SUPPORTED_LANGS` 加一筆
- 新增稀有度顏色：在 `PickCard.jsx` 的 `RARITY_STYLES` 加一筆
- Tooltip 觸發稀有度：在 `PickCard.jsx` 的 `TOOLTIP_RARITIES` Set 加一筆
- API base URL 設定：`frontend/src/api/godfatApi.js` 的 `API_BASE`，或建立 `.env.local` 設定 `VITE_API_BASE_URL`
- 回覆語言：**繁體中文**（程式碼的 proper noun 不需翻譯）
