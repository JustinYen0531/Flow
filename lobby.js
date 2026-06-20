/* ═══════════════════════════════════════════════════════════════
   lobby.js — Flow lobby interactions
   ═══════════════════════════════════════════════════════════════ */

/* ════════════ 0. Built-in recommendation data ════════════ */
const homepageRecommendationData = window.SkiLevels.homepageRecommendationData;

/* ════════════ 1. Utilities ════════════ */
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

/* ════════════ 2. Mini sparkline SVG ════════════ */
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

/* ════════════ 3. Recommendation builders ════════════ */
function buildParkDailyQuest() {
  const f = homepageRecommendationData?.featured;
  if (!f) return `<div class="park-rec-loading">Today's quest loading, please wait...</div>`;
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
          <span class="park-victory-label">Victory Conditions</span>
          <div class="park-victory-list">${reasons}</div>
        </div>
      </div>
      <div class="park-daily-right">
        <div>
          <div class="park-daily-diff-label">Stage Difficulty</div>
          <div class="park-daily-stars">${difficultyLabel}</div>
        </div>
        <button class="park-daily-btn"
          onclick="event.stopPropagation();parkLoadSymbol('${_escHtml(f.symbol)}')">
          Enter Today's Quest
        </button>
      </div>
    </div>`;
}

function buildParkHotQuests() {
  const list = homepageRecommendationData?.hot || [];
  if (!list.length) return `<div class="park-rec-loading">Syncing hot quests...</div>`;
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
        Challenge
      </button>
    </div>`).join('');
}

/* ════════════ 4. Theme stage definitions ════════════ */
const _PARK_THEME_DEFS = [
  {
    id: 'ai_chip', title: 'AI Chips', icon: 'chip',
    desc: 'Focused on compute and GPU server infrastructure — explore the full AI chip supply chain from design to packaging.',
    stages: [
      { sym: 'NVDA',    name: 'Nvidia',    disp: 'NVDA', desc: 'The AI GPU compute core — global market leader' },
      { sym: 'AMD',     name: 'AMD',       disp: 'AMD',  desc: 'Rising challenger to Nvidia in AI accelerator chips' },
      { sym: '2454.TW', name: 'MediaTek',  disp: '2454', desc: 'Taiwan\'s top IC design house — edge AI chip strategy' },
      { sym: 'AVGO',    name: 'Broadcom',  disp: 'AVGO', desc: 'Dominant in AI networking chips and custom ASICs' },
      { sym: 'QCOM',    name: 'Qualcomm',  disp: 'QCOM', desc: 'Snapdragon platform pioneer in on-device AI inference' },
      { sym: 'INTC',    name: 'Intel',     disp: 'INTC', desc: 'Gaudi AI accelerator — the veteran\'s strong comeback' },
    ]
  },
  {
    id: 'us_tech', title: 'US Tech', icon: 'tech',
    desc: 'From FAANG to AI transformation stocks — unlock the core competitiveness of America\'s tech giants one by one.',
    stages: [
      { sym: 'AAPL',  name: 'Apple',     disp: 'AAPL',  desc: 'Consumer electronics moat — bet on Apple Intelligence' },
      { sym: 'MSFT',  name: 'Microsoft', disp: 'MSFT',  desc: 'Azure cloud + Copilot AI — king of enterprise software' },
      { sym: 'GOOGL', name: 'Google',    disp: 'GOOGL', desc: 'Search ad dominance — Gemini AI fighting back strong' },
      { sym: 'META',  name: 'Meta',      disp: 'META',  desc: 'Social ad giant — Llama AI + AR glasses' },
      { sym: 'AMZN',  name: 'Amazon',    disp: 'AMZN',  desc: 'E-commerce + AWS dual engine — full-spectrum AI' },
      { sym: 'NFLX',  name: 'Netflix',   disp: 'NFLX',  desc: 'Streaming profitability leader — ad tier accelerating' },
    ]
  },
  {
    id: 'tw_dragon', title: 'Taiwan Leaders', icon: 'tw',
    desc: 'Taiwan\'s semiconductor moat — dominating from wafer foundry to AI server supply chain.',
    stages: [
      { sym: '2330.TW', name: 'TSMC',              disp: '2330', desc: 'Global wafer foundry champion — unrivaled advanced process moat' },
      { sym: '2454.TW', name: 'MediaTek',           disp: '2454', desc: 'Taiwan\'s #1 IC design house — AI mobile chip global push' },
      { sym: '2317.TW', name: 'Foxconn',            disp: '2317', desc: 'Biggest beneficiary of AI server assembly — GB200 contracts' },
      { sym: '3711.TW', name: 'ASE Group',          disp: '3711', desc: 'CoWoS advanced packaging — key AI position, rising margins' },
      { sym: '2308.TW', name: 'Delta Electronics',  disp: '2308', desc: 'AI server power management core — green energy transition' },
      { sym: '2382.TW', name: 'Quanta',             disp: '2382', desc: 'AI server ODM shipment leader — major GB200 orders' },
    ]
  },
  {
    id: 'ev', title: 'EVs', icon: 'ev',
    desc: 'The most sentiment-driven sector — unlock everything from EV leaders to new energy.',
    stages: [
      { sym: 'TSLA', name: 'Tesla',      disp: 'TSLA', desc: 'EV leader — FSD self-driving + Robotaxi catalyst' },
      { sym: 'RIVN', name: 'Rivian',     disp: 'RIVN', desc: 'Amazon-backed electric pickup star — R2 production imminent' },
      { sym: 'NIO',  name: 'NIO',        disp: 'NIO',  desc: 'China\'s premium EV brand — battery-swap differentiation' },
      { sym: 'LCID', name: 'Lucid',      disp: 'LCID', desc: 'Luxury EV long-range tech — Saudi capital backing' },
      { sym: 'ENPH', name: 'Enphase',    disp: 'ENPH', desc: 'Home solar inverter leader — energy storage growth' },
      { sym: 'PLUG', name: 'Plug Power', disp: 'PLUG', desc: 'Hydrogen fuel cell pioneer — green hydrogen long-term play' },
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
        <div class="park-theme-prog-label">${done}/${total} stages${allDone ? ' · All Clear!' : ''}</div>
        <div class="park-theme-picks">${picks}</div>
        <button class="park-theme-btn"
          onclick="event.stopPropagation();openThemeQuest(${idx})">
          Explore
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

/* ════════════ 5. Theme quest modal ════════════ */
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
    const cls = isDone ? 'done' : isActive ? 'active' : 'locked';
    const ind = isDone ? 'Done' : isActive ? 'Next' : 'Lock';
    const action = isDone
      ? `<span class="park-quest-stage-done-label">Completed</span>`
      : isActive
        ? `<button class="park-quest-stage-btn"
             onclick="_enterThemeStage('${_escHtml(s.sym)}','${_escHtml(s.name)}',${idx})">
             Enter Stage
           </button>`
        : `<span class="park-quest-stage-locked-label">Complete the previous stage first</span>`;
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
            <span class="park-quest-stage-num">Stage ${i + 1}</span>
          </div>
          <div class="park-quest-stage-desc">${_escHtml(s.desc)}</div>
          <div class="park-quest-stage-action">${action}</div>
        </div>
      </div>`;
  }).join('');

  const completeBanner = allDone
    ? `<div class="park-quest-complete-banner">
         Congratulations! All ${total} stages of "${_escHtml(theme.title)}" complete — exclusive medal earned!
       </div>` : '';

  document.getElementById('parkQuestModalContent').innerHTML = `
    <div class="park-quest-modal-header">
      <div class="park-quest-modal-icon">${_parkHtmlIcon(theme.icon)}</div>
      <div>
        <div class="park-quest-modal-title">${_escHtml(theme.title)} Theme Stages</div>
        <div class="park-quest-modal-desc">${_escHtml(theme.desc)}</div>
      </div>
      <button class="park-quest-modal-close" onclick="closeThemeQuest()">X</button>
    </div>
    <div class="park-quest-progress-section">
      <div class="park-quest-prog-bar">
        <div class="park-quest-prog-fill" style="width:${pct}%"></div>
      </div>
      <div class="park-quest-prog-label">${done} / ${total} stages complete · ${pct}%</div>
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

/* ════════════ 6. Resort picker panel ════════════ */
const _PARK_STOCKS = [
  { cat: 'US Tech', stocks: [
    { sym: 'AAPL', name: 'Apple' }, { sym: 'MSFT', name: 'Microsoft' },
    { sym: 'GOOGL', name: 'Google' }, { sym: 'META', name: 'Meta' },
    { sym: 'AMZN', name: 'Amazon' }, { sym: 'NFLX', name: 'Netflix' },
    { sym: 'NVDA', name: 'Nvidia' }, { sym: 'AMD', name: 'AMD' },
    { sym: 'CRM', name: 'Salesforce' }, { sym: 'ORCL', name: 'Oracle' },
  ]},
  { cat: 'Semiconductors', stocks: [
    { sym: 'QCOM', name: 'Qualcomm' }, { sym: 'INTC', name: 'Intel' },
    { sym: 'AVGO', name: 'Broadcom' }, { sym: 'MU', name: 'Micron' },
    { sym: 'AMAT', name: 'Applied Materials' }, { sym: 'LRCX', name: 'Lam Research' },
  ]},
  { cat: 'EVs / Clean Energy', stocks: [
    { sym: 'TSLA', name: 'Tesla' }, { sym: 'RIVN', name: 'Rivian' },
    { sym: 'LCID', name: 'Lucid Motors' }, { sym: 'NIO', name: 'NIO' },
    { sym: 'ENPH', name: 'Enphase' }, { sym: 'PLUG', name: 'Plug Power' },
  ]},
  { cat: 'Finance & Services', stocks: [
    { sym: 'JPM', name: 'JPMorgan' }, { sym: 'BAC', name: 'Bank of America' },
    { sym: 'GS', name: 'Goldman Sachs' }, { sym: 'V', name: 'Visa' },
    { sym: 'MA', name: 'Mastercard' }, { sym: 'BRK-B', name: 'Berkshire B' },
  ]},
  { cat: 'Taiwan Tech', stocks: [
    { sym: '2330.TW', name: 'TSMC', disp: '2330' }, { sym: '2317.TW', name: 'Foxconn', disp: '2317' },
    { sym: '2454.TW', name: 'MediaTek', disp: '2454' }, { sym: '2303.TW', name: 'UMC', disp: '2303' },
    { sym: '2308.TW', name: 'Delta Electronics', disp: '2308' }, { sym: '3711.TW', name: 'ASE Group', disp: '3711' },
    { sym: '2382.TW', name: 'Quanta', disp: '2382' }, { sym: '2395.TW', name: 'Advantech', disp: '2395' },
  ]},
  { cat: 'Taiwan ETFs', stocks: [
    { sym: '0050.TW', name: 'Taiwan 50', disp: '0050' }, { sym: '0056.TW', name: 'High Dividend', disp: '0056' },
    { sym: '006208.TW', name: 'Fubon Taiwan 50', disp: '006208' }, { sym: '00878.TW', name: 'Cathay ESG High Div', disp: '00878' },
    { sym: '00919.TW', name: 'Group Benefits High Yield', disp: '00919' }, { sym: '00929.TW', name: 'FSIT Tech Dividend', disp: '00929' },
  ]},
  { cat: 'Energy / Commodities', stocks: [
    { sym: 'XOM', name: 'ExxonMobil' }, { sym: 'CVX', name: 'Chevron' },
    { sym: 'COP', name: 'ConocoPhillips' }, { sym: 'GLD', name: 'Gold ETF' }, { sym: 'SLV', name: 'Silver ETF' },
  ]},
  { cat: 'China ADRs', stocks: [
    { sym: 'BABA', name: 'Alibaba' }, { sym: 'PDD', name: 'PDD Holdings' },
    { sym: 'JD', name: 'JD.com' }, { sym: 'BIDU', name: 'Baidu' },
  ]},
];

let _parkPickerOpen = false;
let _parkPreviewGameData = null;
let _parkPreviewOptions = null;

function _renderParkPicker(q) {
  const panel = document.getElementById('parkPickerPanel');
  if (!panel) return;
  q = (q || '').toLowerCase().trim();
  let html = `<div class="park-picker-hint">${_parkHtmlIcon('ski')}<span>Select a resort · or type a code and press Enter</span></div>`;
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
      No match for "${_escHtml(q)}" — just press Explore!</div>`;
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

/* ════════════ 7. Quest log ════════════ */
function _getParkQuestLog() {
  try { return JSON.parse(localStorage.getItem('_parkQuestLog') || '[]'); } catch (e) { return []; }
}

function _logParkQuest(symbol, name) {
  if (!symbol) return;
  let log = [];
  try { const s = localStorage.getItem('_parkQuestLog'); if (s) log = JSON.parse(s); } catch (e) {}
  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US') + ' ' +
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

/* ════════════ 8. Profile panel ════════════ */
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
  const level = explored >= 20 ? 'Ski Master' :
    explored >= 10 ? 'Intermediate Rider' :
      explored >= 3 ? 'Junior Explorer' : 'Beginner';

  const medalHtml = [
    { icon: 'Gold', label: 'Gold', key: 'gold' },
    { icon: 'Silver', label: 'Silver', key: 'silver' },
    { icon: 'Bronze', label: 'Bronze', key: 'bronze' },
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
    : `<div class="park-pp-empty">No quest history yet — start exploring!</div>`;

  const visitedSyms = new Set(questLog.map(q => q.symbol));
  const completedThemes = _PARK_THEME_DEFS.filter(t => t.stages.every(s => visitedSyms.has(s.sym)));
  const themeMedalsHtml = completedThemes.length
    ? `<div class="park-pp-section" style="padding-bottom:0">
         <div class="park-pp-section-title">Theme Completion Medals</div>
       </div>
       <div class="park-pp-theme-medals">
         ${completedThemes.map((t) => {
      const tIdx = _PARK_THEME_DEFS.indexOf(t);
      return `<div class="park-pp-theme-medal" onclick="toggleParkProfile();openThemeQuest(${tIdx})">
             <span class="park-pp-theme-medal-icon">${_parkHtmlIcon(t.icon)}</span>
             <span class="park-pp-theme-medal-info">
               <span class="park-pp-theme-medal-title">${_escHtml(t.title)}</span>
               <span class="park-pp-theme-medal-sub">All ${t.stages.length} stages clear</span>
             </span>
             <span class="park-pp-theme-medal-badge">Done</span>
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
          <div class="park-pp-name">Adventurer</div>
          <div class="park-pp-level">${level}</div>
        </div>
        <button class="park-pp-close" onclick="toggleParkProfile()">X</button>
      </div>
      <div class="park-pp-stats">
        <div class="park-pp-stat">
          <span class="park-pp-stat-num">${explored}</span>
          <span class="park-pp-stat-label">Symbols Explored</span>
        </div>
        <div class="park-pp-stat">
          <span class="park-pp-stat-num">${visits}</span>
          <span class="park-pp-stat-label">Total Runs</span>
        </div>
        <div class="park-pp-stat">
          <span class="park-pp-stat-num">${bestSki}</span>
          <span class="park-pp-stat-label">Best Ski Score</span>
        </div>
      </div>
      <div class="park-pp-section">
        <div class="park-pp-section-title">Ski Medals</div>
        <div class="park-pp-medal-row">${medalHtml}</div>
      </div>
      ${themeMedalsHtml}
      <div class="park-pp-section" style="padding-bottom:0.4rem">
        <div class="park-pp-section-title">Quest History</div>
      </div>
      <div class="park-pp-history-list">${historyHtml}</div>
    </div>`;
}

/* ════════════ 9. Snowflakes ════════════ */
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

/* ════════════ 10. Return to home ════════════ */
function returnToHome() {
  const parkWelcome = document.getElementById('parkWelcomePage');
  if (parkWelcome) parkWelcome.classList.remove('hidden');
  document.getElementById('parkPreviewPage')?.classList.add('hidden');
  const input = document.getElementById('parkSymbolInput');
  if (input) input.value = '';
  const lbl = document.getElementById('parkProfileLabel');
  if (lbl) lbl.textContent = 'Adventurer';
}

/* ════════════ 11. Launch adventure from lobby ════════════ */
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
  const parkInput = document.getElementById('parkSymbolInput');
  if (parkInput) parkInput.value = sym;

  const gameData = window.SkiLevels.buildGameData(sym, period);
  window.currentGameData = gameData;
  _parkPreviewGameData = gameData;
  _parkPreviewOptions = {
    highDetail: false,
  };
  renderParkPreview(gameData);
}

function parkLaunchCurrentPreview() {
  if (!window.SkiGame || !_parkPreviewGameData) return;
  window.SkiGame.launch(_parkPreviewGameData, _parkPreviewOptions || {
    highDetail: false,
  });
}

function renderParkPreview(gameData) {
  const preview = document.getElementById('parkPreviewPage');
  const welcome = document.getElementById('parkWelcomePage');
  if (!preview || !gameData) return;

  const closes = (gameData.closes || []).map(Number).filter(v => Number.isFinite(v));
  const first = closes[0] || 0;
  const last = closes[closes.length - 1] || first;
  const pct = first ? ((last - first) / first) * 100 : 0;
  const absMove = Math.abs(last - first);
  const volume = Math.max(1, Math.round((closes.reduce((sum, v) => sum + Math.abs(v - first), 0) / Math.max(1, closes.length)) * 120000));
  const difficulty = window.SkiGame?.previewDifficulty?.(gameData, { highDetail: false });
  const difficultyScore = Math.round(difficulty?.score ?? clampPreviewScore(absMove, pct));
  const periodLabel = {
    '1mo': '1 Month',
    '3mo': '3 Months',
    '6mo': '6 Months',
    '1y': '1 Year',
    '2y': '2 Years',
  }[gameData.period] || gameData.period || '3 Months';

  setText('parkPreviewSymbol', gameData.symbol || '--');
  setText('parkPreviewTitle', gameData.name || gameData.symbol || 'Unknown Resort');
  setText('parkPreviewSubtitle', `${gameData.symbol || 'Route'} is staged as a calm mission preview. Review the terrain, then start when ready.`);
  setText('parkPreviewPeriod', periodLabel);
  setText('parkPreviewBest', '--');
  setText('parkPreviewDifficulty', String(difficultyScore));
  setText('parkPreviewDifficultyMeta', difficulty?.label || 'Standard mode');
  setText('parkPreviewPrice', formatPreviewNumber(last));
  setText('parkPreviewChange', `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`);
  setText('parkPreviewVolume', formatCompactNumber(volume));
  renderParkPreviewSparkline(closes);

  welcome?.classList.add('hidden');
  preview.classList.remove('hidden');
  preview.scrollIntoView({ block: 'start' });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function clampPreviewScore(absMove, pct) {
  return Math.max(10, Math.min(99, 38 + Math.round(absMove / 3 + Math.abs(pct) * 1.2)));
}

function formatPreviewNumber(value) {
  return Number.isFinite(value)
    ? value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
    : '--';
}

function formatCompactNumber(value) {
  return Number.isFinite(value)
    ? Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value)
    : '--';
}

function renderParkPreviewSparkline(closes) {
  const svg = document.getElementById('parkPreviewSparkline');
  if (!svg) return;
  if (!closes.length) {
    svg.innerHTML = '';
    return;
  }
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const points = closes.map((v, i) => {
    const x = (i / Math.max(1, closes.length - 1)) * 900;
    const y = 150 - ((v - min) / range) * 120;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  svg.innerHTML = `
    <polyline class="park-preview-line-shadow" points="${points}" />
    <polyline class="park-preview-line" points="${points}" />
    <line class="park-preview-baseline" x1="0" y1="150" x2="900" y2="150" />
  `;
}

/* ════════════ 12. Medal sync (called by ski-game.js) ════════════ */
function updateSkiMedals() {}
window.updateSkiMedals = updateSkiMedals;

/* ════════════ 13. Init ════════════ */
(function _setupObservers() {
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

  renderParkRecommendations();
  _initParkSnowflakes();
})();
