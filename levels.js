/* ═══════════════════════════════════════════════════════════════
   levels.js — Flow：以代碼為種子的地形產生器
   蒸餾後取代原本由後端 Yahoo Finance 提供的即時資料。
   任何代碼（NVDA、TSLA、2330.TW、售票亭任意輸入…）
   都會以該代碼字串為種子，產生一條穩定可重現的滑雪地形。

   主要 API（給 lobby.js 用）：
     • window.SkiLevels.buildGameData(symbol, period) → currentGameData
     • window.SkiLevels.homepageRecommendationData   → 首頁推薦（featured/hot）
   ═══════════════════════════════════════════════════════════════ */

(function () {

  /* ── 字串 → 穩定整數種子 ──────────────────────── */
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

  /* ── 依期間決定資料長度 ───────────────────────── */
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

  /* ── 核心地形產生器：組合多個波形 ─────────────── */
  function _generateCloses(symbol, period) {
    const seed = _hashSeed(symbol + '|' + period);
    const rand = _seededRandom(seed);
    const n = PERIOD_LENGTH[period] || 80;
    const base = 50 + (seed % 220);                       // 50 ~ 270
    const drift = (rand() - 0.45) * base * 0.004;         // 長期趨勢
    const volA = base * (0.010 + rand() * 0.030);         // 波動幅度
    const volB = base * (0.015 + rand() * 0.040);         // 第二波動
    const cyc1 = 6 + Math.floor(rand() * 14);             // 週期 1
    const cyc2 = 16 + Math.floor(rand() * 28);            // 週期 2
    const phase1 = rand() * Math.PI * 2;
    const phase2 = rand() * Math.PI * 2;
    const shockCount = Math.floor(rand() * 4);            // 跳空次數
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

  /* ── 代碼名稱查表（售票亭/主題關卡用的名稱）──── */
  const _NAME_TABLE = {
    AAPL: 'Apple', MSFT: 'Microsoft', GOOGL: 'Google', META: 'Meta',
    AMZN: 'Amazon', NFLX: 'Netflix', NVDA: 'Nvidia', AMD: 'AMD',
    CRM: 'Salesforce', ORCL: 'Oracle', QCOM: 'Qualcomm', INTC: 'Intel',
    AVGO: 'Broadcom', MU: 'Micron', AMAT: 'Applied Materials',
    LRCX: 'Lam Research', TSLA: 'Tesla', RIVN: 'Rivian',
    LCID: 'Lucid Motors', NIO: '蔚來 NIO', ENPH: 'Enphase', PLUG: 'Plug Power',
    JPM: 'JPMorgan', BAC: 'Bank of America', GS: 'Goldman Sachs',
    V: 'Visa', MA: 'Mastercard', 'BRK-B': 'Berkshire B',
    XOM: 'ExxonMobil', CVX: 'Chevron', COP: 'ConocoPhillips',
    GLD: '黃金 ETF', SLV: '白銀 ETF',
    BABA: '阿里巴巴', PDD: '拼多多', JD: '京東', BIDU: '百度',
    '2330.TW': '台積電', '2317.TW': '鴻海', '2454.TW': '聯發科',
    '2303.TW': '聯電', '2308.TW': '台達電', '3711.TW': '日月光',
    '2382.TW': '廣達', '2395.TW': '研華',
    '0050.TW': '台灣50', '0056.TW': '高股息',
    '006208.TW': '富邦台50', '00878.TW': '國泰永續高股息',
    '00919.TW': '群益高息', '00929.TW': '復華科技優息',
  };

  function _nameOf(symbol) {
    return _NAME_TABLE[symbol] || symbol;
  }

  /* ── 主題色（與 lobby.js 的 _getSymbolTheme 一致）── */
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

  /* ── 滑雪技巧題 ─────────────────────────────── */
  function _skiEducation(symbol) {
    const name = _nameOf(symbol);
    return {
      symbol,
      preview: {
        headline: `${symbol} · 纜車預習`,
        summary: `出發前先掌握滑雪基礎：視線、重心、速度控制與地形判讀。`,
        folders: [],
      },
      nodes: [
        {
          title: '第一站：視線與預判',
          type: 'history',
          summary: '視線看遠一點，提早判讀下一段地形，比盯著腳下更能避免失誤。',
          bullets: ['視線放在前方 2~3 個地形點，提前轉向。',
                    '盯著腳下會反應不及，容易脫線。',
                    '預判坡度變化，提前調整重心。'],
          question: '滑雪時視線應該放在哪裡？',
          choices: ['前方遠處的地形', '自己的滑雪板', '只看正下方一點', '閉眼憑感覺'],
          answerIndex: 0,
          explanation: '看遠方能提早反應，是穩定滑行的第一步。',
          sourceKind: 'curated',
        },
        {
          title: '第二站：重心與速度',
          type: 'volatility',
          summary: '下坡時重心微微前壓可以穩定控制速度，後仰則容易失控加速。',
          bullets: ['下坡重心前壓，避免被甩到後面。',
                    '陡坡放低重心，可吸收地形衝擊。',
                    '想減速時用邊緣刻雪，而非整個身體後仰。'],
          question: '遇到陡坡想穩定控制速度，重心應該如何？',
          choices: ['微微前壓並放低', '盡量往後仰', '完全不彎曲膝蓋', '跳起來避開'],
          answerIndex: 0,
          explanation: '前壓重心讓滑雪板邊緣能確實刻雪減速。',
          sourceKind: 'curated',
        },
        {
          title: '第三站：地形判讀',
          type: 'technical',
          summary: `${name} 的雪道路線會隨地形起伏，學會讀坡度轉折，就能順著節奏滑行。`,
          bullets: ['坡度變陡代表加速區，提前準備減速。',
                    '急轉彎處需要更主動轉向。',
                    '平緩段是回氣與調整的好時機。'],
          question: '看到前方地形突然變陡，最好的反應是？',
          choices: ['提前準備減速與轉向', '完全不減速直衝', '停下來不敢前進', '閉眼睛'],
          answerIndex: 0,
          explanation: '預判陡坡並提前減速，是安全順暢的關鍵。',
          sourceKind: 'curated',
        },
      ],
    };
  }

  /* ── 組裝完整遊戲資料（= currentGameData）──────── */
  function buildGameData(symbol, period) {
    symbol = (symbol || '').trim().toUpperCase() || 'NVDA';
    period = period || '3mo';
    const closes = _generateCloses(symbol, period);
    return {
      symbol,
      closes,
      dates: _genDates(closes.length),
      period,
      education: _skiEducation(symbol),
    };
  }

  /* ── 推薦區資料（餵給 lobby.js 的 homepageRecommendationData）── */
  const _REC_POOL = [
    { sym: 'NVDA', name: 'Nvidia', blurb: 'AI GPU 算力核心，地形起伏劇烈，挑戰性十足' },
    { sym: 'TSLA', name: 'Tesla', blurb: '電動車龍頭，劇烈震盪地形，反應要快' },
    { sym: 'AAPL', name: 'Apple', blurb: '穩健長坡，適合練習基本節奏' },
    { sym: 'AMD',  name: 'AMD',    blurb: '挑戰者曲線，轉折多、節奏快' },
    { sym: 'META', name: 'Meta',   blurb: '社群廣告巨頭，雙峰地形考驗轉換' },
    { sym: 'AMZN', name: 'Amazon', blurb: '電商雙引擎，階梯式地形' },
    { sym: 'MSFT', name: 'Microsoft', blurb: '雲端穩定上坡，速度漸快' },
    { sym: 'GOOGL', name: 'Google', blurb: '搜尋霸主，V 型反轉地形' },
    { sym: '2330.TW', name: '台積電', blurb: '晶圓代工霸主，長坡道穩定推進' },
    { sym: 'AVGO', name: 'Broadcom', blurb: '網路晶片霸主，鋸齒地形密集' },
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
    // 每日關卡：以「今天日期」選一檔，確保當天穩定
    const today = new Date();
    const dayKey = today.getFullYear() * 1000 + today.getMonth() * 32 + today.getDate();
    const pick = _REC_POOL[dayKey % _REC_POOL.length];
    const closes = _generateCloses(pick.sym, '3mo');
    const p = _pctChange(closes);
    const tone = _chipTone(p);
    const chips = [
      { label: tone === 'up' ? '強勢上坡' : tone === 'down' ? '下坡警報' : '橫向盤整', tone },
      { label: '高波動', tone: p < 0 ? 'down' : 'up' },
      { label: '熱門雪場', tone: 'up' },
    ];
    return {
      symbol: pick.sym,
      name: pick.name,
      summary: pick.blurb + '。完成本關卡可獲得每日通關勳章！',
      detail: pick.blurb,
      series: closes,
      chips,
      reasons: ['全程不脫線', '纜車題目全對', '滑雪評級達 A 以上'],
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

  /* ── 暴露到全域 ──────────────────────────────── */
  window.SkiLevels = {
    buildGameData,
    homepageRecommendationData,
    nameOf: _nameOf,
    themeColors: _themeColors,
    generateCloses: _generateCloses,
  };
})();
