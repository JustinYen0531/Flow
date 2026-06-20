# 🎿 Flow

這是一個**純滑雪遊戲**，從原本多功能版本蒸餾而來。
**完整保留原本 park-mode 滑雪樂園登陸頁**（山景背景、飄雪、售票亭、每日/熱門/主題關卡、
精選雪場票卡、三步驟、樂園設施），只把背後資料來源從後端 Yahoo Finance 換成內建地形產生器。

## 🎮 玩法

跟原本的 park-mode 完全一樣：

1. **售票亭**輸入任何代碼（NVDA、TSLA、2330.TW… 或任意字串），選期間
2. 點 **🎿 開始探索！** → 該代碼會以字串為種子生成一條滑雪地形
3. 也可以點 **每日關卡 / 熱門關卡 / 主題關卡 / 精選雪場票卡** 直接進入
4. 進入滑雪：**滾輪**上下移動、**← → 或 A/D** 控制速度，別被拖到最左邊
5. 沿途觸發**纜車教育題**（滑雪技巧問答），完成關卡獲得勳章

> ⚡ 任何代碼都能玩：因為地形是用「代碼字串 + 期間」當種子生成的，
> 同一個代碼每次都會產生完全相同的地形（可重現），不同代碼地形不同。

## 📁 檔案結構

```
flow/
├── index.html          # ★ park-mode 登陸頁（原樣保留：HERO/售票亭/每日/熱門/主題/票卡/步驟/設施）
├── style.css           # 原樣保留（基礎 layout class，park-mode.css 依賴它）
├── park-mode.css       # 原樣保留（3045 行，所有 park 樣式）
├── ski-game.css        # 原樣保留（滑雪 overlay 樣式）
├── ski-game.js         # 滑雪引擎（原樣，僅資源路徑 /static/ → assets/）
├── ski-difficulty.js   # 難度計算（原樣保留）
├── levels.js           # ★ 新增：以代碼為種子的地形產生器 + homepageRecommendationData
├── lobby.js            # ★ park-mode 大廳 JS（原樣移植，parkLoadSymbol 改接內建生成）
├── serve.js            # 極簡本地靜態伺服器
├── test-lobby.js       # 27 項無頭測試（全綠）
└── assets/             # 遊戲主題視覺資產（原樣複製）
    ├── homepage-backgrounds/   # 關卡背景 SVG（NVDA/AAPL/AMZN/GOOGL/META/MSFT/intel/2330…）
    ├── ski-props/              # 滑雪場道具
    ├── theme-source-images/
    └── themes/                 # 高細節主題（AAPL/AMZN/GOOGL/META/MSFT/NVDA/intel）
```

## 🚀 本地預覽

```bash
node serve.js
```
開啟 **http://localhost:8765**

> ⚠️ 遊戲會用 `fetch` 載入 `assets/homepage-backgrounds/manifest.json`，
> 直接用 `file://` 開啟會被瀏覽器擋下，請透過 http 伺服器預覽。

## 🧪 測試
```bash
node test-lobby.js   # 27 項全綠
```

## 📝 與原專案的差異

| 項目 | 原專案 | Flow |
|------|------|------|
| **park-mode 登陸頁** | 完整 | **完整保留（一字不改）** |
| 山景 SVG + 飄雪背景 | 有 | **完整保留** |
| 售票亭 / 每日 / 熱門 / 主題關卡 | 有 | **完整保留** |
| 精選雪場票卡、三步驟、樂園設施 | 有 | **完整保留** |
| 個人資料面板、闖關紀錄、勳章 | 有 | **完整保留** |
| Express 後端 + Yahoo Finance + Gemini AI | 有 | 移除 |
| K線/RSI/MACD 圖表、AI建議、AI聊天 | 有 | 移除 |
| 即時資料當地形 | 後端 Yahoo Finance | **內建地形產生器（代碼當種子）** |
| 纜車題目 | 公司知識庫 | 換成滑雪技巧問答 |
| 滑雪遊戲引擎（ski-game.js 4950 行） | 有 | **完整保留** |

### 技術細節
- **登陸頁 HTML**：`index.html` 的 `parkWelcomePage` 與 `park-bg` 區塊從原檔一字不改搬過來
- **登陸頁 JS**：`lobby.js` 原樣移植原 `index.html` 內嵌的 park-mode script（`_PARK_THEME_DEFS`、
  `_PARK_STOCKS`、`buildPark*`、picker、quest modal、profile、飄雪全保留），唯一改動是
  `parkLoadSymbol` / `parkStartAdventure` 不再呼叫 `loadStock()`，改用
  `SkiLevels.buildGameData(symbol, period)` 生成地形後啟動 `SkiGame.launch()`
- **`body` 永遠帶 `park-mode` class**：因為純遊戲，直接固定在 park-mode（park-mode.css 樣式都掛在 `body.park-mode` 下）
- **`<body class="park-mode">`**：讓 park-mode.css 所有樣式直接生效
