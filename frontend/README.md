# godfat-frontend

Battle Cats 轉蛋查詢工具的前端輸入頁面（Vite + React）。

## 安裝與啟動

```bash
npm install
npm run dev
```

開發伺服器預設在 http://localhost:5742

後端 API 預設指向 http://localhost:8742，要改的話設定環境變數
`VITE_API_BASE_URL`（例如建一個 `.env.local`：`VITE_API_BASE_URL=http://localhost:8742`）。

## 目前的三個畫面

1. **輸入頁面**：貼網址解析出 `seed`、`lang`（忽略 `last`），或直接手動輸入。
2. **選活動頁面**：呼叫 `GET /api/events` 拿 Upcoming 活動清單，下拉選單顯示
   「日期區間：標題」，選一個之後把對應的 `value` 當作 `event` 參數。
3. **結果頁面**：呼叫 `GET /api/tracks?seed=...&event=...&lang=...`，
   把回傳的 A/B 分組格子資料列出來。

## 架構說明（SOLID）

| 檔案 | 職責 |
|---|---|
| `src/utils/urlParser.js` | 只負責把貼上的網址字串解析成 `{ seed, lang }` |
| `src/api/godfatApi.js` | 只負責跟後端 API 溝通（`fetchUpcomingEvents` / `fetchTracks`） |
| `src/components/UrlImportForm.jsx` | 貼網址表單（第 1 畫面） |
| `src/components/SeedQueryForm.jsx` | 手動輸入 seed/lang 表單（第 1 畫面） |
| `src/components/EventSelect.jsx` | 活動下拉選單（第 2 畫面） |
| `src/components/ResultColumns.jsx` / `PickCard.jsx` | 結果顯示（第 3 畫面） |
| `src/App.jsx` | 管理畫面切換（query → event → result）、串接 API 呼叫 |

每個元件只管自己那塊 UI 跟互動，畫面切換邏輯跟 API 呼叫都集中在 `App.jsx`，
之後要拆路由（react-router）或加新畫面，只要在 `SCREENS` 加一個狀態即可。
