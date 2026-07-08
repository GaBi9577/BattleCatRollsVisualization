# Battle Cats 轉蛋查詢工具

這個壓縮檔裡有：

```
godfat_app/
  backend/    ← 爬蟲 + API（Python）
  frontend/   ← 網頁介面（React）
  start.bat   ← 一鍵啟動（Windows）
```

## 最快的方式：雙擊 start.bat

裝好 Python / Node.js，且第一次的 `pip install` / `npm install` 都跑過之後
（見下方「第 0～3 步」），之後每次要用，**直接雙擊 `start.bat`** 就好：

- 只會開**一個視窗**：後端在背景默默執行，前端會直接顯示在這個視窗裡，
  不用自己打 `cd`、`uvicorn`、`npm run dev`
- 約 5 秒後自動幫你打開瀏覽器到 http://localhost:5742
- 要關掉服務的話，在這個視窗按一次 `Ctrl + C` 就好，後端會跟著自動關閉，
  不用再多開視窗手動 kill

如果是第一次使用、或 `start.bat` 雙擊沒反應，照下面的步驟手動設定一次。

---


## 第 0 步：先確認電腦有沒有裝這兩個工具

打開「終端機」（Mac 叫 Terminal，Windows 叫 PowerShell 或 cmd），輸入：

```bash
python3 --version
node --version
```

- 如果兩個都有顯示版本號（例如 `Python 3.12.3`、`v20.11.0`），就可以跳到第 1 步。
- 如果說「找不到指令」，代表還沒裝：
  - Python：去 https://www.python.org/downloads/ 下載安裝（安裝時記得勾選 "Add to PATH"）
  - Node.js：去 https://nodejs.org/ 下載 LTS 版本安裝

---

## 第 1 步：解壓縮

把這個 zip 檔解壓縮到你想放的地方，例如桌面。解壓縮後會看到 `godfat_app` 資料夾。

---

## 第 2 步：啟動後端（爬蟲 + API）

打開**第一個**終端機視窗，輸入（把路徑換成你實際解壓縮的位置）：

```bash
cd 桌面/godfat_app/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8742
```

看到類似這樣的訊息，代表後端啟動成功，**這個視窗不要關掉**：

```
Uvicorn running on http://127.0.0.1:8742
```

> 如果 `pip install` 出現權限錯誤，試試看 `pip install -r requirements.txt --user`，
> 或是用 `pip3` 取代 `pip`。

---

## 第 3 步：啟動前端（網頁介面）

打開**第二個**終端機視窗（不要關掉第一個），輸入：

```bash
cd 桌面/godfat_app/frontend
npm install
npm run dev
```

看到類似這樣的訊息：

```
Local:   http://localhost:5742/
```

---

## 第 4 步：打開網頁

瀏覽器打開 http://localhost:5742 ，就會看到查詢頁面了。

流程：
1. 貼網址或輸入 seed → 查詢
2. 選一個活動（event）
3. 看結果（A / B 兩欄轉蛋格子）

---

## 之後要再打開的話

直接雙擊 `start.bat` 就好（不用重新 `npm install` / `pip install`）。

如果想手動開(例如要看某個視窗的詳細錯誤訊息)，一樣可以照原本的方式：

```bash
# 視窗一
cd 桌面/godfat_app/backend
uvicorn main:app --reload --port 8742

# 視窗二
cd 桌面/godfat_app/frontend
npm run dev
```

## 常見問題

- **網頁打開是空白的 / 查詢一直失敗**：檢查第一個終端機視窗（後端）還開著嗎？
- **`port 8742 已被占用`**：把指令改成 `uvicorn main:app --reload --port 8001`，
  然後在 `frontend/.env.local` 加一行 `VITE_API_BASE_URL=http://localhost:8001`
  （如果沒有 `.env.local` 這個檔案，自己新增一個）。
- **想關掉**：在兩個終端機視窗按 `Ctrl + C`。
