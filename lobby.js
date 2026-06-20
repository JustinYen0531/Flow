/* ═══════════════════════════════════════════════════════════════
   lobby.js — Flow 大廳互動
   原樣移植自原 index.html 內嵌的 park-mode script，只做兩處改動：
     1. parkStartAdventure / parkLoadSymbol 不再呼叫後端 loadStock()，
        改用 SkiLevels.buildGameData(symbol) 生成地形，並啟動滑雪遊戲。
     2. homepageRecommendationData 改由 levels.js 內建提供。
   其餘（_PARK_THEME_DEFS / _PARK_STOCKS / buildPark* / picker /
        quest modal / profile / 飄雪）全部原樣保留。
   ═══════════════════════════════════════════════════════════════ */

/* ════════════ 0. 內建推薦資料（取代後端） ════════════ */
const homepageRecommendationData = window.SkiLevels.homepageRecommendationData;

/* ════════════ 1. 通用工具（原樣保留） ════════════ */
function _escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function _parkHtmlIcon(type) {
  const safeType = String(type || 'dot').replace(/[^a-z0-9_-]/gi, '');
  if (safeType === 'ski') {
    return `<span class="park-html-icon park-html-icon-ski" aria-hidden="true"><span class="park-html-icon-body"></span><span class="park-html-icon-line"></span></span>`;
  }
  return `<span class="park-html-icon park-html-icon-${safeType}" aria-hidden="true"><span></span></span>`;
}

function _getSymbolTheme(sym) {
  const palette = [
    ['#00cfaa', '#0080c0'], ['#ff7043', '#d32f2f'],
    ['#7c4dff', '#2979ff'], ['#ffb300', '#f57c00'],
    ['#00bcd4', '#00838f'], ['#66bb6a', '#2e7d32'],
    ['#ec407a', '#ad1457'], ['#ab47bc', '#6a1b9a'],
  ];
  let idx = 0;
  for (let i = 0; i < (sym || '').length; i++) idx += sym.charCodeAt(i);
  return palette[idx % palette.length];
}

/* ════════════ 2. 迷你折線 SVG（原樣保留） ════════════ */
function _buildSparklineSvg(series) {
  if (!series || series.length < 2) return '';
  const vals = series.map(Number).filter(v => !isNaN(v));
  if (vals.length < 2) return '';
  const mn = Math.min(...vals), mx = Math.max(...vals);
  const range = mx - mn || 1;
  const W = 120, H = 40;
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W;
    const y = H - ((v - mn) / range) * (H - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const up = vals[vals.length - 1] >= vals[0];
  const clr = up ? '#00cfaa' : '#ff5252';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
    width="${W}" height="${H}" class="park-daily-thumb-spark" style="display:block">
    <polyline points="${pts}" fill="none" stroke="${clr}"
      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/* ════════════ 3. 推薦區建構（原樣保留） ════════════ */
function buildParkDailyQuest() {
  const f = homepageRecommendationData?.featured;
  if (!f) return `<div class="park-rec-loading">今日關卡準備中，請稍候...</div>`;
  const chips = (f.chips || []).map(c =>
    `<span class="park-quest-chip ${_escHtml(c.tone || '')}">${_escHtml(c.label)}</span>`
  ).join('');
  const reasons = (f.reasons || []).map(r =>
    `<span class="park-victory-cond"><span class="park-inline-mark" aria-hidden="true"></span>${_escHtml(r)}</span>`
  ).join('');
  const diff = Math.min(5, Math.max(2, (f.chips?.length || 3)));
  const difficultyLabel = `Level ${diff}/5`;
  const [c1, c2] = _getSymbolTheme(f.symbol || '');
  const spark = _buildSparklineSvg(f.series || []);
  const icon = _parkHtmlIcon((f.chips || []).length > 3 ? 'rank' : 'ski');
  return `
    <div class="park-daily-card" onclick="parkLoadSymbol('${_escHtml(f.symbol)}')">
      <div class="park-daily-thumb">
        <svg class="park-daily-thumb-bg" xmlns="http://www.w3.org/2000/svg"
          width="100%" height="100%"
          style="position:absolute;inset:0;width:100%;height:100%">
          <defs><linearGradient id="pdg_${_escHtml(f.symbol)}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="${c1}"/>
            <stop offset="100%" stop-color="${c2}"/>
          </linearGradient></defs>
          <rect width="100%" height="100%" fill="url(#pdg_${_escHtml(f.symbol)})"/>
        </svg>
        <span class="park-daily-thumb-icon">${icon}</span>
        <span class="park-daily-thumb-sym">${_escHtml(f.symbol)}</span>
        ${spark}
      </div>
      <div class="park-daily-left">
        <div class="park-daily-sym-row">
          <span class="park-daily-symbol">${_escHtml(f.symbol)}</span>
          <span class="park-daily-name">${_escHtml(f.name)}</span>
        </div>
        <p class="park-daily-summary">${_escHtml(f.summary || f.detail || '')}</p>
        <div class="park-daily-chips">${chips}</div>
        <div>
          <span class="park-victory-label">勝利條件</span>
          <div class="park-victory-list">${reasons}</div>
        </div>
      </div>
      <div class="park-daily-right">
        <div>
          <div class="park-daily-diff-label">關卡難度</div>
          <div class="park-daily-stars">${difficultyLabel}</div>
        </div>
        <button class="park-daily-btn"
          onclick="event.stopPropagation();parkLoadSymbol('${_escHtml(f.symbol)}')">
          進入今日關卡
        </button>
      </div>
    </div>`;
}

function buildParkHotQuests() {
  const list = homepageRecommendationData?.hot || [];
  if (!list.length) return `<div class="park-rec-loading">熱門關卡同步中...</div>`;
  const rankCls = ['rank-1', 'rank-2', 'rank-3', 'rank-4'];
  return list.slice(0, 4).map((item, i) => `
    <div class="park-hot-card ${item.trend === 'down' ? 'is-down' : 'is-up'}"
         onclick="parkLoadSymbol('${_escHtml(item.symbol)}')">
      <div class="park-hot-rank ${rankCls[i] || ''}">#${i + 1}</div>
      <div class="park-hot-sym-group">
        <span class="park-hot-symbol">${_escHtml(item.symbol)}</span>
        <span class="park-hot-name">${_escHtml(item.name)}</span>
      </div>
      <span class="park-hot-change">${_escHtml(item.change)}</span>
      <p class="park-hot-blurb">${_escHtml(item.blurb || '')}</p>
      <button class="park-hot-btn"
        onclick="event.stopPropagation();parkLoadSymbol('${_escHtml(item.symbol)}')">
        挑戰
      </button>
    </div>`).join('');
}

/* ════════════ 4. 主題關卡定義（原樣保留） ════════════ */
const _PARK_THEME_DEFS = [
  {
    id: 'ai_chip', title: 'AI 晶片', icon: 'chip',
    desc: '聚焦算力與伺服器 GPU 主線，探索 AI 晶片供應鏈從設計到封裝的完整生態。',
    stages: [
      { sym: 'NVDA',    name: 'Nvidia',   disp: 'NVDA', desc: 'AI GPU 算力核心，全球市場領頭羊' },
      { sym: 'AMD',     name: 'AMD',      disp: 'AMD',  desc: '挑戰 Nvidia 的 AI 加速晶片新秀' },
      { sym: '2454.TW', name: '聯發科',   disp: '2454', desc: '台灣 IC 設計龍頭，端側 AI 芯片佈局' },
      { sym: 'AVGO',    name: 'Broadcom', disp: 'AVGO', desc: 'AI 網路晶片與客製化 ASIC 霸主' },
      { sym: 'QCOM',    name: 'Qualcomm', disp: 'QCOM', desc: 'Snapdragon 平台端側 AI 推理先鋒' },
      { sym: 'INTC',    name: 'Intel',    disp: 'INTC', desc: 'Gaudi AI 加速卡，老將的強力反攻' },
    ]
  },
  {
    id: 'us_tech', title: '美股科技', icon: 'tech',
    desc: '從 FAANG 到 AI 轉型股，逐一解鎖美國科技龍頭的核心競爭力。',
    stages: [
      { sym: 'AAPL',  name: 'Apple',     disp: 'AAPL',  desc: '消費電子生態護城河，Apple Intelligence 押注' },
      { sym: 'MSFT',  name: 'Microsoft', disp: 'MSFT',  desc: 'Azure 雲端 + Copilot AI，企業軟體王者' },
      { sym: 'GOOGL', name: 'Google',    disp: 'GOOGL', desc: '搜尋廣告霸主，Gemini AI 強力迎戰' },
      { sym: 'META',  name: 'Meta',      disp: 'META',  desc: '社群廣告巨頭，Llama AI + AR 眼鏡' },
      { sym: 'AMZN',  name: 'Amazon',    disp: 'AMZN',  desc: '電商 + AWS 雲端雙引擎，AI 全面佈局' },
      { sym: 'NFLX',  name: 'Netflix',   disp: 'NFLX',  desc: '串流媒體獲利轉型先驅，廣告層加速成長' },
    ]
  },
  {
    id: 'tw_dragon', title: '台灣龍頭', icon: 'tw',
    desc: '台灣半導體護城河，從晶圓代工到 AI 伺服器供應鏈全面制霸。',
    stages: [
      { sym: '2330.TW', name: '台積電', disp: '2330', desc: '全球晶圓代工霸主，先進製程護城河無人能敵' },
      { sym: '2454.TW', name: '聯發科', disp: '2454', desc: 'IC 設計台灣第一，AI 手機芯片全球佈局' },
      { sym: '2317.TW', name: '鴻海',   disp: '2317', desc: 'AI 伺服器代工最大受惠者，GB200 組裝' },
      { sym: '3711.TW', name: '日月光', disp: '3711', desc: 'CoWoS 先進封裝 AI 關鍵卡位，毛利持續提升' },
      { sym: '2308.TW', name: '台達電', disp: '2308', desc: 'AI 伺服器電源管理核心，綠能轉型受惠' },
      { sym: '2382.TW', name: '廣達',   disp: '2382', desc: 'AI 伺服器 ODM 出貨量龍頭，GB200 大單' },
    ]
  },
  {
    id: 'ev', title: '電動車', icon: 'ev',
    desc: '最能反映市場情緒起伏的題材，從領頭羊到新能源全面解鎖。',
    stages: [
      { sym: 'TSLA', name: 'Tesla',      disp: 'TSLA', desc: '電動車龍頭，FSD 自動駕駛 + Robotaxi 催化' },
      { sym: 'RIVN', name: 'Rivian',     disp: 'RIVN', desc: '亞馬遜背書的電動皮卡新星，R2 量產在即' },
      { sym: 'NIO',  name: '蔚來 NIO',  disp: 'NIO',  desc: '中國高端電動車領導品牌，換電模式差異化' },
      { sym: 'LCID', name: 'Lucid',      disp: 'LCID', desc: '豪華電動車長航程技術，沙烏地資本加持' },
      { sym: 'ENPH', name: 'Enphase',    disp: 'ENPH', desc: '家用太陽能逆變器龍頭，儲能業務高速成長' },
      { sym: 'PLUG', name: 'Plug Power', disp: 'PLUG', desc: '氫能燃料電池先驅，綠氫佈局長線題材' },
    ]
  },
];

function buildParkThemeQuests() {
  const visitedSyms = new Set(_getParkQuestLog().map(q => q.symbol));
  return _PARK_THEME_DEFS.map((theme, idx) => {
    const done = theme.stages.filter(s => visitedSyms.has(s.sym)).length;
    const total = theme.stages.length;
    const pct = Math.round((done / total) * 100);
    const allDone = done === total;
    const picks = theme.stages.slice(0, 4).map(s =>
      `<span class="park-theme-pick"
         onclick="event.stopPropagation();parkLoadSymbol('${_escHtml(s.sym)}','${_escHtml(s.name)}')"
       >${_escHtml(s.disp || s.sym)}</span>`
    ).join('');
    return `
      <div class="park-theme-card${allDone ? ' is-complete' : ''}" onclick="openThemeQuest(${idx})">
        <div class="park-theme-card-icon">${_parkHtmlIcon(theme.icon)}${allDone ? '<span class="park-theme-crown">Done</span>' : ''}</div>
        <div class="park-theme-card-title">${_escHtml(theme.title)}</div>
        <div class="park-theme-card-desc">${_escHtml(theme.desc)}</div>
        <div class="park-theme-prog-bar">
          <div class="park-theme-prog-fill" style="width:${pct}%"></div>
        </div>
        <div class="park-theme-prog-label">${done}/${total} 關卡${allDone ? ' · 全部通關！' : ''}</div>
        <div class="park-theme-picks">${picks}</div>
        <button class="park-theme-btn"
          onclick="event.stopPropagation();openThemeQuest(${idx})">
          探索關卡
        </button>
      </div>`;
  }).join('');
}

function renderParkRecommendations() {
  const d = document.getElementById('parkDailyQuest');
  const h = document.getElementById('parkHotQuests');
  const t = document.getElementById('parkThemeQuests');
  if (d) d.innerHTML = buildParkDailyQuest();
  if (h) h.innerHTML = buildParkHotQuests();
  if (t) t.innerHTML = buildParkThemeQuests();
}

/* ════════════ 5. 主題任務 Modal（原樣保留） ════════════ */
let _activeThemeIdx = null;

function openThemeQuest(idx) {
  _activeThemeIdx = idx;
  try { localStorage.setItem('_parkActiveTheme', String(idx)); } catch (e) {}
  _buildQuestModal(idx);
  const overlay = document.getElementById('parkQuestModalOverlay');
  if (overlay) { overlay.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}

function closeThemeQuest() {
  const overlay = document.getElementById('parkQuestModalOverlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
  _activeThemeIdx = null;
  const t = document.getElementById('parkThemeQuests');
  if (t) t.innerHTML = buildParkThemeQuests();
}

function _buildQuestModal(idx) {
  const theme = _PARK_THEME_DEFS[idx];
  if (!theme) return;
  const visitedSyms = new Set(_getParkQuestLog().map(q => q.symbol));
  const done = theme.stages.filter(s => visitedSyms.has(s.sym)).length;
  const total = theme.stages.length;
  const pct = Math.round((done / total) * 100);
  const allDone = done === total;

  const stagesHtml = theme.stages.map((s, i) => {
    const isDone = visitedSyms.has(s.sym);
    const isActive = !isDone && (i === 0 || visitedSyms.has(theme.stages[i - 1].sym));
    const isLocked = !isDone && !isActive;
    const cls = isDone ? 'done' : isActive ? 'active' : 'locked';
    const ind = isDone ? 'Done' : isActive ? 'Next' : 'Lock';
    const action = isDone
      ? `<span class="park-quest-stage-done-label">已完成</span>`
      : isActive
        ? `<button class="park-quest-stage-btn"
             onclick="_enterThemeStage('${_escHtml(s.sym)}','${_escHtml(s.name)}',${idx})">
             進入關卡
           </button>`
        : `<span class="park-quest-stage-locked-label">請先完成上一關</span>`;
    const connector = i < theme.stages.length - 1
      ? `<div class="park-quest-connector"></div>` : '';
    return `
      <div class="park-quest-stage-row ${cls}">
        <div class="park-quest-stage-left">
          <div class="park-quest-stage-indicator">${ind}</div>
          ${connector}
        </div>
        <div class="park-quest-stage-content">
          <div class="park-quest-stage-header">
            <span class="park-quest-stage-sym">${_escHtml(s.disp || s.sym)}</span>
            <span class="park-quest-stage-name">${_escHtml(s.name)}</span>
            <span class="park-quest-stage-num">第 ${i + 1} 關</span>
          </div>
          <div class="park-quest-stage-desc">${_escHtml(s.desc)}</div>
          <div class="park-quest-stage-action">${action}</div>
        </div>
      </div>`;
  }).join('');

  const completeBanner = allDone
    ? `<div class="park-quest-complete-banner">
         恭喜完成「${_escHtml(theme.title)}」主題全 ${total} 關！獲得專屬勳章
       </div>` : '';

  document.getElementById('parkQuestModalContent').innerHTML = `
    <div class="park-quest-modal-header">
      <div class="park-quest-modal-icon">${_parkHtmlIcon(theme.icon)}</div>
      <div>
        <div class="park-quest-modal-title">${_escHtml(theme.title)} 主題關卡</div>
        <div class="park-quest-modal-desc">${_escHtml(theme.desc)}</div>
      </div>
      <button class="park-quest-modal-close" onclick="closeThemeQuest()">X</button>
    </div>
    <div class="park-quest-progress-section">
      <div class="park-quest-prog-bar">
        <div class="park-quest-prog-fill" style="width:${pct}%"></div>
      </div>
      <div class="park-quest-prog-label">${done} / ${total} 關卡完成 · ${pct}%</div>
    </div>
    ${completeBanner}
    <div class="park-quest-stage-list">${stagesHtml}</div>`;
}

function _enterThemeStage(sym, name, themeIdx) {
  closeThemeQuest();
  _activeThemeIdx = themeIdx;
  try { localStorage.setItem('_parkActiveTheme', String(themeIdx)); } catch (e) {}
  parkLoadSymbol(sym, name);
}

/* ════════════ 6. 售票亭選股面板（原樣保留） ════════════ */
const _PARK_STOCKS = [
  { cat: '美國科技', stocks: [
    { sym: 'AAPL', name: 'Apple' }, { sym: 'MSFT', name: 'Microsoft' },
    { sym: 'GOOGL', name: 'Google' }, { sym: 'META', name: 'Meta' },
    { sym: 'AMZN', name: 'Amazon' }, { sym: 'NFLX', name: 'Netflix' },
    { sym: 'NVDA', name: 'Nvidia' }, { sym: 'AMD', name: 'AMD' },
    { sym: 'CRM', name: 'Salesforce' }, { sym: 'ORCL', name: 'Oracle' },
  ]},
  { cat: '半導體', stocks: [
    { sym: 'QCOM', name: 'Qualcomm' }, { sym: 'INTC', name: 'Intel' },
    { sym: 'AVGO', name: 'Broadcom' }, { sym: 'MU', name: 'Micron' },
    { sym: 'AMAT', name: 'Applied Materials' }, { sym: 'LRCX', name: 'Lam Research' },
  ]},
  { cat: '電動車/新能源', stocks: [
    { sym: 'TSLA', name: 'Tesla' }, { sym: 'RIVN', name: 'Rivian' },
    { sym: 'LCID', name: 'Lucid Motors' }, { sym: 'NIO', name: '蔚來 NIO' },
    { sym: 'ENPH', name: 'Enphase' }, { sym: 'PLUG', name: 'Plug Power' },
  ]},
  { cat: '商務服務', stocks: [
    { sym: 'JPM', name: 'JPMorgan' }, { sym: 'BAC', name: 'Bank of America' },
    { sym: 'GS', name: 'Goldman Sachs' }, { sym: 'V', name: 'Visa' },
    { sym: 'MA', name: 'Mastercard' }, { sym: 'BRK-B', name: 'Berkshire B' },
  ]},
  { cat: '台灣科技', stocks: [
    { sym: '2330.TW', name: '台積電', disp: '2330' }, { sym: '2317.TW', name: '鴻海', disp: '2317' },
    { sym: '2454.TW', name: '聯發科', disp: '2454' }, { sym: '2303.TW', name: '聯電', disp: '2303' },
    { sym: '2308.TW', name: '台達電', disp: '2308' }, { sym: '3711.TW', name: '日月光', disp: '3711' },
    { sym: '2382.TW', name: '廣達', disp: '2382' }, { sym: '2395.TW', name: '研華', disp: '2395' },
  ]},
  { cat: '台灣 ETF', stocks: [
    { sym: '0050.TW', name: '台灣50', disp: '0050' }, { sym: '0056.TW', name: '高股息', disp: '0056' },
    { sym: '006208.TW', name: '富邦台50', disp: '006208' }, { sym: '00878.TW', name: '國泰永續高股息', disp: '00878' },
    { sym: '00919.TW', name: '群益高息', disp: '00919' }, { sym: '00929.TW', name: '復華科技優息', disp: '00929' },
  ]},
  { cat: '能源/原物料', stocks: [
    { sym: 'XOM', name: 'ExxonMobil' }, { sym: 'CVX', name: 'Chevron' },
    { sym: 'COP', name: 'ConocoPhillips' }, { sym: 'GLD', name: '黃金 ETF' }, { sym: 'SLV', name: '白銀 ETF' },
  ]},
  { cat: '中概股', stocks: [
    { sym: 'BABA', name: '阿里巴巴' }, { sym: 'PDD', name: '拼多多' },
    { sym: 'JD', name: '京東' }, { sym: 'BIDU', name: '百度' },
  ]},
];

let _parkPickerOpen = false;

function _renderParkPicker(q) {
  const panel = document.getElementById('parkPickerPanel');
  if (!panel) return;
  q = (q || '').toLowerCase().trim();
  let html = `<div class="park-picker-hint">${_parkHtmlIcon('ski')}<span>選擇雪場 · 或直接輸入代碼後按 Enter</span></div>`;
  let anyResult = false;
  _PARK_STOCKS.forEach(({ cat, stocks }) => {
    const btns = stocks.map(s => {
      const disp = s.disp || s.sym;
      const match = !q || s.sym.toLowerCase().includes(q) ||
        (s.disp || '').toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q);
      anyResult = anyResult || match;
      return `<button class="park-picker-btn${match ? '' : ' hidden'}"
        onclick="_parkPickStock('${_escHtml(s.sym)}','${_escHtml(s.name)}')">
        <span class="park-picker-btn-sym">${_escHtml(disp)}</span>
        <span class="park-picker-btn-name">${_escHtml(s.name)}</span>
      </button>`;
    }).join('');
    const catVisible = !q || stocks.some(s =>
      s.sym.toLowerCase().includes(q) ||
      (s.disp || '').toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
    );
    html += `<div class="park-picker-cat${catVisible ? '' : ' all-hidden'}">
      <div class="park-picker-cat-hd">${_escHtml(cat)}</div>
      <div class="park-picker-stocks">${btns}</div>
    </div>`;
  });
  if (!anyResult) {
    html += `<div class="park-picker-hint" style="color:rgba(255,180,100,0.6);padding:0.6rem 0.4rem">
      找不到「${_escHtml(q)}」，直接按開始探索！</div>`;
  }
  panel.innerHTML = html;
}

function openParkPicker() {
  const panel = document.getElementById('parkPickerPanel');
  if (!panel || _parkPickerOpen) return;
  _parkPickerOpen = true;
  const q = (document.getElementById('parkSymbolInput')?.value || '');
  _renderParkPicker(q);
  panel.classList.remove('hidden');
}

function closeParkPicker() {
  const panel = document.getElementById('parkPickerPanel');
  if (!panel) return;
  _parkPickerOpen = false;
  panel.classList.add('hidden');
}

function _parkPickStock(sym, name) {
  closeParkPicker();
  const parkInput = document.getElementById('parkSymbolInput');
  if (parkInput) parkInput.value = sym;
  parkLoadSymbol(sym, name);
}

/* ════════════ 7. 闖關紀錄（原樣保留） ════════════ */
function _getParkQuestLog() {
  try { return JSON.parse(localStorage.getItem('_parkQuestLog') || '[]'); } catch (e) { return []; }
}

function _logParkQuest(symbol, name) {
  if (!symbol) return;
  let log = [];
  try { const s = localStorage.getItem('_parkQuestLog'); if (s) log = JSON.parse(s); } catch (e) {}
  const now = new Date();
  const timeStr = now.toLocaleDateString('zh-TW') + ' ' +
    now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  const idx = log.findIndex(q => q.symbol === symbol);
  if (idx >= 0) {
    log[idx].count = (log[idx].count || 1) + 1;
    log[idx].time = timeStr;
    if (name) log[idx].name = name;
    const item = log.splice(idx, 1)[0];
    log.push(item);
  } else {
    log.push({ symbol, name: name || '', time: timeStr, count: 1 });
  }
  if (log.length > 50) log = log.slice(-50);
  try { localStorage.setItem('_parkQuestLog', JSON.stringify(log)); } catch (e) {}
  const lbl = document.getElementById('parkProfileLabel');
  if (lbl) lbl.textContent = symbol;
}

/* ════════════ 8. 個人資料面板（原樣保留） ════════════ */
function toggleParkProfile() {
  const panel = document.getElementById('parkProfilePanel');
  if (!panel) return;
  if (panel.classList.contains('hidden')) {
    renderParkProfile();
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
}

function renderParkProfile() {
  let progress = {}, medals = {}, questLog = [];
  try { const s = localStorage.getItem('skiProgress');  if (s) progress = JSON.parse(s); } catch (e) {}
  try { const s = localStorage.getItem('skiMedals');    if (s) medals = JSON.parse(s); } catch (e) {}
  try { const s = localStorage.getItem('_parkQuestLog'); if (s) questLog = JSON.parse(s); } catch (e) {}

  const explored = questLog.length;
  const visits = questLog.reduce((sum, q) => sum + (q.count || 1), 0);
  const bestSki = progress.bestSkiScore || 0;
  const level = explored >= 20 ? '滑雪大師' :
    explored >= 10 ? '中級滑手' :
      explored >= 3 ? '初級探險者' : '新手滑手';

  const medalHtml = [
    { icon: 'Gold', label: '金牌', key: 'gold' },
    { icon: 'Silver', label: '銀牌', key: 'silver' },
    { icon: 'Bronze', label: '銅牌', key: 'bronze' },
  ].map(m => {
    const cnt = medals[m.key] || progress[m.key] || 0;
    return `<span class="park-pp-medal ${cnt > 0 ? 'earned' : 'locked'}">${m.icon} ${m.label} ×${cnt}</span>`;
  }).join('');

  const recent = [...questLog].reverse().slice(0, 20);
  const historyHtml = recent.length
    ? recent.map(q => `
      <div class="park-pp-record"
        onclick="parkLoadSymbol('${_escHtml(q.symbol)}');toggleParkProfile()">
        <span class="park-pp-rec-sym">${_escHtml(q.symbol)}</span>
        <span class="park-pp-rec-info">
          <span class="park-pp-rec-name">${_escHtml(q.name || '')}</span>
          <span class="park-pp-rec-time">${_escHtml(q.time || '')}</span>
        </span>
        <span class="park-pp-rec-badge">×${q.count || 1}</span>
      </div>`).join('')
    : `<div class="park-pp-empty">尚無闖關紀錄，開始探索吧！</div>`;

  const visitedSyms = new Set(questLog.map(q => q.symbol));
  const completedThemes = _PARK_THEME_DEFS.filter(t => t.stages.every(s => visitedSyms.has(s.sym)));
  const themeMedalsHtml = completedThemes.length
    ? `<div class="park-pp-section" style="padding-bottom:0">
         <div class="park-pp-section-title">主題通關勳章</div>
       </div>
       <div class="park-pp-theme-medals">
         ${completedThemes.map((t) => {
      const tIdx = _PARK_THEME_DEFS.indexOf(t);
      return `<div class="park-pp-theme-medal" onclick="toggleParkProfile();openThemeQuest(${tIdx})">
             <span class="park-pp-theme-medal-icon">${_parkHtmlIcon(t.icon)}</span>
             <span class="park-pp-theme-medal-info">
               <span class="park-pp-theme-medal-title">${_escHtml(t.title)}</span>
               <span class="park-pp-theme-medal-sub">全 ${t.stages.length} 關通關</span>
             </span>
             <span class="park-pp-theme-medal-badge">完成</span>
           </div>`;
    }).join('')}
       </div>` : '';

  const panel = document.getElementById('parkProfilePanel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="park-pp-inner">
      <div class="park-pp-header">
        <div class="park-pp-avatar">${_parkHtmlIcon('ski')}</div>
        <div>
          <div class="park-pp-name">冒險者</div>
          <div class="park-pp-level">${level}</div>
        </div>
        <button class="park-pp-close" onclick="toggleParkProfile()">X</button>
      </div>
      <div class="park-pp-stats">
        <div class="park-pp-stat">
          <span class="park-pp-stat-num">${explored}</span>
          <span class="park-pp-stat-label">探索代碼數</span>
        </div>
        <div class="park-pp-stat">
          <span class="park-pp-stat-num">${visits}</span>
          <span class="park-pp-stat-label">總探索次數</span>
        </div>
        <div class="park-pp-stat">
          <span class="park-pp-stat-num">${bestSki}</span>
          <span class="park-pp-stat-label">最佳滑雪分</span>
        </div>
      </div>
      <div class="park-pp-section">
        <div class="park-pp-section-title">滑雪獎牌</div>
        <div class="park-pp-medal-row">${medalHtml}</div>
      </div>
      ${themeMedalsHtml}
      <div class="park-pp-section" style="padding-bottom:0.4rem">
        <div class="park-pp-section-title">闖關紀錄</div>
      </div>
      <div class="park-pp-history-list">${historyHtml}</div>
    </div>`;
}

/* ════════════ 9. 飄雪粒子（原樣保留） ════════════ */
function _initParkSnowflakes() {
  const canvas = document.getElementById('parkSnowCanvas');
  if (!canvas || canvas.childElementCount > 0) return;
  const chars = ['.', '*', '+'];
  for (let i = 0; i < 38; i++) {
    const flake = document.createElement('span');
    flake.className = 'park-snowflake';
    flake.textContent = chars[Math.floor(Math.random() * chars.length)];
    const size = 0.55 + Math.random() * 0.9;
    const dur = 7 + Math.random() * 11;
    const delay = -Math.random() * 14;
    const left = Math.random() * 100;
    flake.style.cssText =
      `left:${left}%;font-size:${size}rem;` +
      `animation-duration:${dur}s;animation-delay:${delay}s;` +
      `opacity:${0.35 + Math.random() * 0.55}`;
    canvas.appendChild(flake);
  }
}

/* ════════════ 10. 返回首頁 ════════════ */
function returnToHome() {
  const parkWelcome = document.getElementById('parkWelcomePage');
  if (parkWelcome) parkWelcome.classList.remove('hidden');
  const input = document.getElementById('parkSymbolInput');
  if (input) input.value = '';
  const lbl = document.getElementById('parkProfileLabel');
  if (lbl) lbl.textContent = '冒險者';
}

/* ═══════════════════════════════════════════════════════════════
   11. ★關鍵改動★：從樂園首頁啟動探索
       原本 → loadStock()（後端 Yahoo Finance）
       現在 → SkiLevels.buildGameData(symbol) 生成地形 → 開滑雪
   ═══════════════════════════════════════════════════════════════ */
function parkStartAdventure() {
  const parkInput = document.getElementById('parkSymbolInput');
  const parkPeriod = document.getElementById('parkPeriodSelect');
  const sym = (parkInput?.value || '').trim().toUpperCase();
  if (!sym) { parkInput?.focus(); return; }
  closeParkPicker();
  const period = parkPeriod?.value || '3mo';
  parkLoadSymbol(sym, '', period);
}

function parkLoadSymbol(sym, name, period) {
  sym = (sym || '').trim().toUpperCase();
  if (!sym) return;
  period = period || document.getElementById('parkPeriodSelect')?.value || '3mo';
  _logParkQuest(sym, name || window.SkiLevels.nameOf(sym) || '');
  // 同步顯示用的搜尋欄（隱藏的）
  const parkInput = document.getElementById('parkSymbolInput');
  if (parkInput) parkInput.value = sym;

  // 生成地形資料（取代後端）
  const gameData = window.SkiLevels.buildGameData(sym, period);
  window.currentGameData = gameData;

  // 啟動滑雪遊戲
  if (window.SkiGame) {
    window.SkiGame.launch(gameData, {
      highDetail: false,
      education: gameData.education,
    });
  }
}

/* ════════════ 12. 勳章同步（ski-game.js 會呼叫） ════════════ */
function updateSkiMedals() {
  // park profile 開啟時會即時重算，這裡只需確保全域可呼叫
}
window.updateSkiMedals = updateSkiMedals;

/* ════════════ 13. 啟動初始化 ════════════ */
(function _setupObservers() {
  // 售票亭輸入事件
  const parkInput = document.getElementById('parkSymbolInput');
  if (parkInput) {
    parkInput.addEventListener('focus', () => openParkPicker());
    parkInput.addEventListener('input', () => {
      openParkPicker();
      _renderParkPicker(parkInput.value);
    });
    parkInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { closeParkPicker(); parkStartAdventure(); }
      if (e.key === 'Escape') closeParkPicker();
    });
  }
  // 點擊外部關閉選股面板
  document.addEventListener('click', e => {
    if (!_parkPickerOpen) return;
    const panel = document.getElementById('parkPickerPanel');
    const input = document.getElementById('parkSymbolInput');
    const startBtn = document.querySelector('.park-start-btn');
    if (panel && !panel.contains(e.target) &&
      input && !input.contains(e.target) &&
      !(startBtn && startBtn.contains(e.target))) {
      closeParkPicker();
    }
  });

  // 渲染推薦區 + 飄雪
  renderParkRecommendations();
  _initParkSnowflakes();
})();
