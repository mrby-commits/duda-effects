# duda-effects

React Bits 風格的動態效果庫，打包成**單一 JS 檔**，用 HTML 標籤掛到 DUDA（美安網路中心）網站上。

## 安裝到 DUDA

1. 編輯器 → 開發模式 `</>` → **Site HTML/CSS** 的 head，加入（版本號換成最新的 tag）：

   ```html
   <script src="https://cdn.jsdelivr.net/gh/<帳號>/duda-effects@v0.1.0/dist/effects.js" defer></script>
   ```

2. 頁面上要放效果的地方：新增 → 其他 → **HTML** 元件，貼上下面任一段。

> 編輯器畫面裡可能看不到動畫，請用「預覽」或發佈後查看。

## 效果

### SplitText：文字逐字淡入

```html
<div data-rb="SplitText" data-tag="h2" data-font-size="40px" data-delay="60">承百年香火，記一世平安。</div>
```

| 參數 | 預設 | 說明 |
|---|---|---|
| `data-tag` | `div` | h1 / h2 / h3 / p / span |
| `data-split-type` | `chars` | `chars` 逐字、`words` 逐詞 |
| `data-delay` | `40` | 每字間隔（毫秒） |
| `data-duration` | `600` | 每字動畫長度（毫秒） |
| `data-distance` | `40` | 起始下移距離（px） |
| `data-once` | `true` | 只播一次 |
| `data-align` / `data-font-size` / `data-color` / `data-font-weight` | | 樣式 |

### Aurora：極光背景（WebGL）

```html
<div data-rb="Aurora" data-height="460px" data-colors="#3A29FF,#FF94B4,#FF3232">
  <h1 style="color:#fff">標題直接寫在裡面</h1>
</div>
```

| 參數 | 預設 | 說明 |
|---|---|---|
| `data-colors` | `#3A29FF,#FF94B4,#FF3232` | 三個顏色 |
| `data-height` | `400px` | 高度 |
| `data-background` | `#060010` | 底色 |
| `data-amplitude` / `data-blend` / `data-speed` | `1` / `0.5` / `1` | 波動、柔和、速度 |
| `data-align` / `data-padding` | `center` / `40px 24px` | 上層內容排版 |

### ClickSpark：點擊火花（整頁生效，放一次即可）

```html
<div data-rb="ClickSpark" data-color="#ff6a3d"></div>
```

參數：`data-color`、`data-spark-count`、`data-spark-size`、`data-spark-radius`、`data-duration`、`data-line-width`。

## 開發

```bash
npm install
npm run dev     # 開啟 index.html 測試頁
npm run build   # 輸出 dist/effects.js（要一起 commit）
```

發新版：改 `package.json` 與 `src/main.jsx` 的版本 → build → commit → 打 tag（如 `v0.2.0`）→ push tag。
DUDA 上把網址的版本號換成新 tag。

## 授權說明

效果為自行實作，參考 [React Bits](https://reactbits.dev) 的效果概念；Aurora 使用的 simplex noise 來自 Ashima Arts（MIT）。
