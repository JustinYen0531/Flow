/* 無頭測試：模擬 DOM 載入 levels.js + lobby.js，
   驗證 park 登陸頁的每日/熱門/主題關卡真的有渲染出卡片內容。
   使用：node test-lobby.js */
const fs = require('fs');
const path = require('path');

// ── 模擬 DOM ────────────────────────────────
const elements = new Map();
function makeEl(id) {
  if (elements.has(id)) return elements.get(id);
  const styleStore = {};
  const el = {
    id, _text: '', _html: '', _cls: new Set(), dataset: {},
    children: [],
    style: {
      setProperty(k, v) { styleStore[k] = v; },
      getPropertyValue(k) { return styleStore[k]; },
      set cssText(v) { this._css = v; },
    },
    classList: {
      add(c) { el._cls.add(c); },
      remove(c) { el._cls.delete(c); },
      toggle(c, f) { if (f === undefined) { el._cls.has(c) ? el._cls.delete(c) : el._cls.add(c); } else if (f) el._cls.add(c); else el._cls.delete(c); },
      contains(c) { return el._cls.has(c); },
    },
    set textContent(v) { this._text = String(v); },
    get textContent() { return this._text; },
    set innerHTML(v) { this._html = String(v); },
    get innerHTML() { return this._html; },
    set value(v) { this._value = v; },
    get value() { return this._value || ''; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    appendChild(c) { this.children.push(c); return c; },
  };
  elements.set(id, el);
  return el;
}

global.window = { innerWidth: 1280, innerHeight: 720, addEventListener() {}, requestAnimationFrame() {} };
global.document = {
  readyState: 'complete',
  body: { style: {}, classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, appendChild() {} },
  getElementById(id) { return makeEl(id); },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement(tag) {
    return { tagName: tag, className: '', textContent: '', style: { cssText: '' },
      classList: { add() {} }, setAttribute() {}, appendChild() {} };
  },
  addEventListener() {},
};
global.localStorage = { _s: {}, getItem(k) { return this._s[k] ?? null; }, setItem(k, v) { this._s[k] = String(v); } };
global.MutationObserver = class { observe() {} disconnect() {} };

// ── 載入腳本（按照 index.html 順序）────
eval(fs.readFileSync(path.join(__dirname, 'levels.js'), 'utf8'));
eval(fs.readFileSync(path.join(__dirname, 'lobby.js'), 'utf8'));

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log('  ✓ ' + msg); }
  else { fail++; console.log('  ✗ FAIL: ' + msg); }
}

console.log('\n═══ 測試 1：每日關卡渲染 ═══');
const daily = makeEl('parkDailyQuest');
assert(!daily._html.includes('park-rec-loading') || daily._html.includes('park-daily-card'),
  '每日關卡已渲染（非載入中）');
assert(daily._html.includes('park-daily-card'), '包含 .park-daily-card 卡片');
assert(daily._html.includes('park-victory-cond'), '包含勝利條件');
assert(daily._html.includes('parkLoadSymbol('), '卡片有 parkLoadSymbol onclick');

console.log('\n═══ 測試 2：熱門關卡渲染 ═══');
const hot = makeEl('parkHotQuests');
assert(hot._html.includes('park-hot-card'), '包含 .park-hot-card 卡片');
assert((hot._html.match(/park-hot-card/g) || []).length === 4, '渲染出 4 張熱門卡片');
assert(hot._html.includes('park-hot-rank'), '包含排名 #1~#4');

console.log('\n═══ 測試 3：主題關卡渲染 ═══');
const theme = makeEl('parkThemeQuests');
assert(theme._html.includes('park-theme-card'), '包含 .park-theme-card 卡片');
assert((theme._html.match(/openThemeQuest\(\d\)/g) || []).length === 8, '渲染出 4 個主題（每主題2個 openThemeQuest = 8）');
assert(theme._html.includes('AI 晶片') && theme._html.includes('電動車'), '主題標題正確');
assert(theme._html.includes('openThemeQuest('), '主題卡片可點擊開啟 Modal');

console.log('\n═══ 測試 4：parkLoadSymbol 生成遊戲資料 ═══');
let launchedData = null, launchedOpts = null;
global.window.SkiGame = {
  launch(data, opts) { launchedData = data; launchedOpts = opts; }
};
parkLoadSymbol('NVDA', 'Nvidia', '3mo');
assert(launchedData !== null, 'parkLoadSymbol 觸發 SkiGame.launch');
assert(launchedData.symbol === 'NVDA', '遊戲資料 symbol = NVDA');
assert(Array.isArray(launchedData.closes) && launchedData.closes.length === 80, 'closes 有 80 筆');
assert(launchedData.dates.length === 80, 'dates 有 80 筆');
assert(!!launchedData.education && launchedData.education.nodes.length === 3, 'education 有 3 個纜車題');

console.log('\n═══ 測試 5：售票亭任意代碼也能玩 ═══');
parkLoadSymbol('WHATEVER123', '', '1mo');
assert(launchedData.symbol === 'WHATEVER123', '任意代碼 WHATEVER123 也能生成關卡');
assert(launchedData.closes.length === 30, '1mo 期間生成 30 筆資料');

console.log('\n═══ 測試 6：主題任務 Modal 建構 ═══');
const modalContent = makeEl('parkQuestModalContent');
const overlay = makeEl('parkQuestModalOverlay');
openThemeQuest(0); // AI 晶片
assert(modalContent._html.includes('AI 晶片'), 'Modal 顯示「AI 晶片」主題');
assert(modalContent._html.includes('park-quest-stage-row'), '包含關卡階段列表');
assert((modalContent._html.match(/park-quest-stage-row/g) || []).length === 6, 'AI 晶片主題有 6 個階段');

console.log('\n═══ 測試 7：個人資料面板 ═══');
const profile = makeEl('parkProfilePanel');
renderParkProfile();
assert(profile._html.includes('park-pp-inner'), '個人資料面板已渲染');
assert(profile._html.includes('滑雪獎牌'), '包含滑雪獎牌區');
assert(profile._html.includes('闖關紀錄'), '包含闖關紀錄區');

console.log('\n═══ 測試 8：飄雪粒子生成 ═══');
const snow = makeEl('parkSnowCanvas');
let appendCount = 0;
const origAppend = snow.appendChild.bind(snow);
snow.appendChild = (c) => { appendCount++; snow.children.push(c); return c; };
_initParkSnowflakes();
assert(appendCount === 38, '生成 38 個飄雪粒子 (appendChild 呼叫 ' + appendCount + ' 次)');

console.log('\n═══ 測試 9：闖關紀錄寫入 ═══');
parkLoadSymbol('TSLA', 'Tesla', '3mo');
parkLoadSymbol('TSLA', 'Tesla', '3mo');
const log = JSON.parse(localStorage.getItem('_parkQuestLog'));
const tslaEntry = log.find(q => q.symbol === 'TSLA');
assert(!!tslaEntry, 'TSLA 已寫入闖關紀錄');
assert(tslaEntry.count === 2, 'TSLA 探索次數 = 2');

console.log('\n═══ 結果 ═══');
console.log('  通過：' + pass + '，失敗：' + fail);
process.exit(fail > 0 ? 1 : 0);
