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

### FadeIn：捲動淡入（v0.2）

```html
<!-- 包住自己的內容；data-stagger 讓子項目依序出現 -->
<div data-rb="FadeIn" data-direction="up" data-stagger="150">
  <div class="cards"> <div>卡片1</div> <div>卡片2</div> <div>卡片3</div> </div>
</div>

<!-- 套用到 DUDA 原生元件：在元件的 CSS class 加上 fade，頁面任一處放這行 -->
<div data-rb="FadeIn" data-target=".fade" data-stagger="120"></div>
```

參數：`direction`（up/down/left/right/none）、`distance`(40)、`duration`(800)、`delay`(0)、`stagger`(0)、`scale`(1)、`blur`(0)、`threshold`(0.15)、`once`(true)、`target`（CSS 選擇器）。

### CountUp：數字跑動（v0.2）

```html
<div data-rb="CountUp" data-to="128000" data-suffix="+" data-font-size="56px" data-font-weight="700"></div>
```

參數：`to`、`from`(0)、`duration`(2000)、`decimals`（自動）、`separator`(`,`，不要給 `none`)、`prefix`、`suffix`、`tag`、`font-size`、`color`、`font-weight`。

### Marquee：跑馬燈（v0.2）

```html
<div data-rb="Marquee" data-items="安太歲|點光明燈|祈福法會" data-separator="✦" data-font-size="24px"></div>

<!-- logo 牆：每個直接子元素是一個項目 -->
<div data-rb="Marquee" data-speed="40" data-gap="64px">
  <img src="logo1.png" height="40"><img src="logo2.png" height="40">
</div>
```

參數：`items`（`|` 分隔）、`speed`（px/秒，60）、`direction`（left/right）、`gap`(48px)、`separator`、`pause-on-hover`(true)、`fade`(true)、`font-size`、`color`、`font-weight`。

### Particles：3D 粒子背景（v0.2，WebGL）

```html
<div data-rb="Particles" data-height="460px" data-colors="#ffffff,#e0a458">
  <h1 style="color:#fff">標題直接寫在裡面</h1>
</div>
```

參數：`count`（200，手機自動減半）、`colors`、`height`(400px)、`background`（#060010，可給 transparent）、`speed`(0.1)、`size`(100)、`spread`(10)、`hover`(true)、`rotate`(true)、`align`、`padding`。

### TiltCard：卡片 3D 傾斜（v0.2）

```html
<!-- 包住自己的內容 -->
<div data-rb="TiltCard" data-max-tilt="12"><img src="..." style="width:100%"></div>

<!-- 套用到 DUDA 原生元件：在元件的 CSS class 加上 tilt -->
<div data-rb="TiltCard" data-target=".tilt"></div>
```

參數：`max-tilt`(10)、`scale`(1.03)、`perspective`(900)、`glare`(true)、`speed`(400)、`radius`(16px)、`target`。觸控裝置自動停用。

### Depth3D：2.5D 立體視差（v0.3，WebGL）

一張圖片＋一張深度圖，滑鼠移動時產生立體景深；手機自動緩慢擺動（Android 可傾斜手機控制）。

```html
<div data-rb="Depth3D"
     data-image="https://cdn.jsdelivr.net/gh/mrby-commits/duda-effects@v0.3.0/assets/pinan/pinan-ink.jpg"
     data-depth="https://cdn.jsdelivr.net/gh/mrby-commits/duda-effects@v0.3.0/assets/pinan/pinan-depth.jpg"
     data-alt="臺南平安宮外觀" data-height="80vh" data-align="left" data-valign="bottom">
  <h1>標題直接寫在裡面</h1>
</div>
```

參數：`image`、`depth`（灰階：白＝近、黑＝遠）、`alt`、`ratio`(3/2)、`height`、`strength`(0.035)、`focus`(0.5)、`zoom`(1.08)、`auto`(true)、`follow`（window/self）、`align`、`valign`、`padding`。

#### 製作素材（`tools/`）

```bash
python -m venv --system-site-packages .venv
.venv/Scripts/pip install opencv-python-headless transformers   # 另需 torch
# 1) 風格化：粗黑線稿＋古廟配色
.venv/Scripts/python -I tools/stylize.py 原圖.jpg 風格圖.jpg --sat 1.0 --paper 0.05 --floor 0.08 --contrast 1.18 --ms 14,32 --canny 25,75 --line 6 --min-edge 150
# 2) 深度圖：Depth Anything V2 Small（Apache-2.0）
.venv/Scripts/python -I tools/depth.py 原圖.jpg 深度圖.png
```

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
