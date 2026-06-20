/* ═══════════════════════════════════════════════════════════════
   levels.js — Flow: ticker-seeded terrain generator
   Any ticker (NVDA, TSLA, 2330.TW, …) produces a stable,
   reproducible ski terrain seeded from that ticker string.

   Public API (consumed by lobby.js):
     • window.SkiLevels.buildGameData(symbol, period) → currentGameData
     • window.SkiLevels.homepageRecommendationData   → featured/hot
   ═══════════════════════════════════════════════════════════════ */

(function () {

  function _hashSeed(str) {
    let h = 0;
    for (let i = 0; i < (str || '').length; i++) {
      h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return (h % 2147483647) + 1;
  }

  function _seededRandom(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  const PERIOD_LENGTH = {
    '1mo': 30, '3mo': 80, '6mo': 130, '1y': 200, '2y': 260,
  };

  function _genDates(count) {
    const out = [];
    const today = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push(d.toISOString().slice(0, 10));
    }
    return out;
  }

  function _generateCloses(symbol, period) {
    const seed = _hashSeed(symbol + '|' + period);
    const rand = _seededRandom(seed);
    const n = PERIOD_LENGTH[period] || 80;
    const base = 50 + (seed % 220);
    const drift = (rand() - 0.45) * base * 0.004;
    const volA = base * (0.010 + rand() * 0.030);
    const volB = base * (0.015 + rand() * 0.040);
    const cyc1 = 6 + Math.floor(rand() * 14);
    const cyc2 = 16 + Math.floor(rand() * 28);
    const phase1 = rand() * Math.PI * 2;
    const phase2 = rand() * Math.PI * 2;
    const shockCount = Math.floor(rand() * 4);
    const shocks = {};
    for (let k = 0; k < shockCount; k++) {
      shocks[Math.floor(rand() * n)] = (rand() - 0.4) * base * 0.18;
    }

    const closes = [];
    let v = base;
    for (let i = 0; i < n; i++) {
      v += drift
         + Math.sin(i / cyc1 * Math.PI * 2 + phase1) * volA
         + Math.sin(i / cyc2 * Math.PI * 2 + phase2) * volB
         + (rand() - 0.5) * volA * 0.8
         + (shocks[i] || 0);
      closes.push(+Math.max(5, v).toFixed(2));
    }
    return closes;
  }

  const _NAME_TABLE = {
    AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Google', META: 'Meta',
    AMZN: 'Amazon', NFLX: 'Netflix', NVDA: 'Nvidia', AMD: 'AMD',
    CRM: 'Salesforce', ORCL: 'Oracle', QCOM: 'Qualcomm', INTC: 'Intel',
    AVGO: 'Broadcom', MU: 'Micron', AMAT: 'Applied Materials',
    LRCX: 'Lam Research', TSLA: 'Tesla', RIVN: 'Rivian',
    LCID: 'Lucid Motors', NIO: 'NIO', ENPH: 'Enphase', PLUG: 'Plug Power',
    JPM: 'JPMorgan', BAC: 'Bank of America', GS: 'Goldman Sachs',
    V: 'Visa', MA: 'Mastercard', 'BRK-B': 'Berkshire B',
    XOM: 'ExxonMobil', CVX: 'Chevron', COP: 'ConocoPhillips',
    GLD: 'Gold ETF', SLV: 'Silver ETF',
    BABA: 'Alibaba', PDD: 'PDD Holdings', JD: 'JD.com', BIDU: 'Baidu',
    '2330.TW': 'TSMC', '2317.TW': 'Foxconn', '2454.TW': 'MediaTek',
    '2303.TW': 'UMC', '2308.TW': 'Delta Electronics', '3711.TW': 'ASE Group',
    '2382.TW': 'Quanta', '2395.TW': 'Advantech',
    '0050.TW': 'Taiwan 50', '0056.TW': 'High Dividend',
    '006208.TW': 'Fubon Taiwan 50', '00878.TW': 'Cathay ESG High Div',
    '00919.TW': 'Group Benefits High Yield', '00929.TW': 'FSIT Tech Dividend',
  };

  function _nameOf(symbol) {
    return _NAME_TABLE[symbol] || symbol;
  }

  function _themeColors(symbol) {
    const palette = [
      ['#00cfaa', '#0080c0'], ['#ff7043', '#d32f2f'],
      ['#7c4dff', '#2979ff'], ['#ffb300', '#f57c00'],
      ['#00bcd4', '#00838f'], ['#66bb6a', '#2e7d32'],
      ['#ec407a', '#ad1457'], ['#ab47bc', '#6a1b9a'],
    ];
    let idx = 0;
    for (let i = 0; i < (symbol || '').length; i++) idx += symbol.charCodeAt(i);
    return palette[idx % palette.length];
  }

  function buildGameData(symbol, period) {
    symbol = (symbol || '').trim().toUpperCase() || 'NVDA';
    period = period || '3mo';
    const closes = _generateCloses(symbol, period);
    return {
      symbol,
      closes,
      dates: _genDates(closes.length),
      period,
    };
  }

  const _REC_POOL = [
    { sym: 'NVDA',    name: 'Nvidia',    blurb: 'AI GPU compute core — intense, technical terrain that demands quick reflexes' },
    { sym: 'TSLA',    name: 'Tesla',     blurb: 'EV leader — wild swings and sharp drops, stay on your toes' },
    { sym: 'AAPL',    name: 'Apple',     blurb: 'Steady long slope — perfect for drilling fundamental rhythm' },
    { sym: 'AMD',     name: 'AMD',       blurb: 'Challenger curve — lots of turns, fast tempo' },
    { sym: 'META',    name: 'Meta',      blurb: 'Social ad giant — twin-peak terrain tests your transitions' },
    { sym: 'AMZN',    name: 'Amazon',    blurb: 'Dual-engine e-commerce — step-ladder terrain' },
    { sym: 'MSFT',    name: 'Microsoft', blurb: 'Steady cloud uphill — pace builds gradually' },
    { sym: 'GOOGL',   name: 'Google',    blurb: 'Search giant — V-shaped reversal terrain' },
    { sym: '2330.TW', name: 'TSMC',      blurb: 'Wafer foundry champion — long, stable slope that builds momentum' },
    { sym: 'AVGO',    name: 'Broadcom',  blurb: 'Network chip king — dense sawtooth terrain' },
  ];

  function _pctChange(closes) {
    if (!closes || closes.length < 2) return 0;
    return ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100;
  }

  function _changeStr(closes) {
    const p = _pctChange(closes);
    return (p >= 0 ? '+' : '') + p.toFixed(2) + '%';
  }

  function _chipTone(p) {
    if (p > 5) return 'up';
    if (p < -5) return 'down';
    return 'flat';
  }

  function _buildFeatured() {
    const today = new Date();
    const dayKey = today.getFullYear() * 1000 + today.getMonth() * 32 + today.getDate();
    const pick = _REC_POOL[dayKey % _REC_POOL.length];
    const closes = _generateCloses(pick.sym, '3mo');
    const p = _pctChange(closes);
    const tone = _chipTone(p);
    const chips = [
      { label: tone === 'up' ? 'Strong Uphill' : tone === 'down' ? 'Downhill Alert' : 'Sideways Chop', tone },
      { label: 'High Volatility', tone: p < 0 ? 'down' : 'up' },
      { label: 'Featured Resort', tone: 'up' },
    ];
    return {
      symbol: pick.sym,
      name: pick.name,
      summary: pick.blurb + '. Complete this quest to earn the daily clear medal!',
      detail: pick.blurb,
      series: closes,
      chips,
      reasons: ['Stay on course the whole run', 'Keep your rhythm through the terrain', 'Earn a ski rating of A or above'],
    };
  }

  function _buildHot() {
    return _REC_POOL.slice(0, 6).map(item => {
      const closes = _generateCloses(item.sym, '3mo');
      const p = _pctChange(closes);
      return {
        symbol: item.sym,
        name: item.name,
        blurb: item.blurb,
        series: closes,
        change: _changeStr(closes),
        trend: p >= 0 ? 'up' : 'down',
      };
    });
  }

  const homepageRecommendationData = {
    featured: _buildFeatured(),
    hot: _buildHot(),
  };

  window.SkiLevels = {
    buildGameData,
    homepageRecommendationData,
    nameOf: _nameOf,
    themeColors: _themeColors,
    generateCloses: _generateCloses,
  };
})();
