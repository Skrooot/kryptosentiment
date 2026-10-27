// Tester för indexberäkningen (www/score.js) och bakgrundskörningen (runners/background-main.js).
// Kör: npm test        (lägg till --live för att även testa mot riktig CoinGecko-data)
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const scoreSrc = fs.readFileSync(path.join(root, "www", "score.js"), "utf8") + "\n" + fs.readFileSync(path.join(root, "www", "stocks.js"), "utf8");
const runnerSrc = fs.readFileSync(path.join(root, "runners", "background-main.js"), "utf8");
const S = new Function(`${scoreSrc}; return { STOCKS, STOCK_MODEL, STOCK_MIN_CLOSES, stockScoreAt, stockItem, fetchStocks, CG, MARKETS_URL, DAILY_URL, BINANCE, dailySource, HISTORY_MAX_AGE, AVANZA, CLASSES, MODEL, clamp, classIdx, rsi, modelFeatures, modelScore, computeScores, staleHistoryIds, parseDaily };`)();

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log("  ok   " + name); }
  catch (e) { failed++; console.log("  FEL  " + name + "\n       " + e.message); }
}

// Syntetiskt mynt: 90 dagliga stängningar + 168 timpriser, med daglig volatilitet `vol` och en trend.
// trend: "up" = stark uppgång senaste månaden, "down" = kraftigt fall, "flat" = sidledes.
function series(trend, vol = 0.03, start = 100) {
  const daily = [], wiggle = (i) => 1 + vol * 0.6 * Math.sin(i * 2.1);
  for (let i = 0; i < 90; i++) {
    let lvl = start;
    if (trend === "up") lvl = start * (i < 60 ? 1 : Math.exp(vol * 1.2 * (i - 59)));
    if (trend === "down") lvl = start * (i < 60 ? 1 : Math.exp(-vol * 1.2 * (i - 59)));
    daily.push(lvl * wiggle(i));
  }
  const last = daily[89], end = trend === "up" ? last * Math.exp(vol * 1.2) : trend === "down" ? last * Math.exp(-vol * 1.2) : last;
  const s7 = Array.from({ length: 168 }, (_, i) => (last * 0.97 + (end - last * 0.97) * i / 167) * (1 + vol * 0.05 * Math.sin(i)));
  return { daily, s7 };
}
function market(id, s7, opts = {}) {
  const p = s7[s7.length - 1];
  return {
    id, name: opts.name ?? id, symbol: opts.symbol ?? id.slice(0, 3), image: "", market_cap_rank: 1,
    current_price: opts.current_price ?? p, market_cap: 1e9, total_volume: 5e7,
    price_change_percentage_24h_in_currency: 0, price_change_percentage_7d_in_currency: (p / s7[0] - 1) * 100,
    price_change_percentage_30d_in_currency: opts.ch30 === undefined ? 0 : opts.ch30,
    sparkline_in_7d: { price: s7 }
  };
}
const hist = (daily) => ({ at: Date.now(), daily });
const scoreOf = (trend, vol) => { const { daily, s7 } = series(trend, vol); return S.computeScores([market("solana", s7)], { solana: hist(daily) })[0]; };

(async () => {
  console.log("Indexberäkning (modell " + S.MODEL.version + ")");
  await test("nivågränser 0–24, 25–44, 45–55, 56–75, 76–100", () => {
    const want = { 0: 0, 24: 0, 25: 1, 44: 1, 45: 2, 55: 2, 56: 3, 75: 3, 76: 4, 100: 4 };
    for (const [v, c] of Object.entries(want)) assert.strictEqual(S.classIdx(+v), c, `värde ${v}`);
  });
  await test("RSI: bara uppgång 100, bara nedgång 0, platt 50", () => {
    const up = Array.from({ length: 40 }, (_, i) => 100 + i);
    assert.strictEqual(S.rsi(up), 100);
    assert.ok(S.rsi(up.slice().reverse()) < 0.001);
    assert.strictEqual(S.rsi(Array(40).fill(5)), 50);
  });
  await test("uppgång ger girighet, fall ger rädsla, sidledes hamnar i mitten", () => {
    const up = scoreOf("up").score, down = scoreOf("down").score, flat = scoreOf("flat").score;
    assert.ok(up >= 76, `uppgång ${up}`);
    assert.ok(down <= 24, `fall ${down}`);
    assert.ok(flat > down && flat < up && flat >= 25 && flat <= 75, `sidledes ${flat}`);
  });
  await test("samma rörelse i förhållande till myntets volatilitet ger ungefär samma index", () => {
    const calm = scoreOf("up", 0.02).score, wild = scoreOf("up", 0.08).score;
    assert.ok(Math.abs(calm - wild) <= 6, `lugnt ${calm}, svängigt ${wild}`);
  });
  await test("alla index är heltal 0–100 och vikterna summerar till 1", () => {
    for (const t of ["up", "down", "flat"]) for (const v of [0.005, 0.03, 0.2]) {
      const c = scoreOf(t, v);
      assert.ok(Number.isInteger(c.score) && c.score >= 0 && c.score <= 100, `${t}/${v}: ${c.score}`);
      c.parts.forEach((p) => assert.ok(p.v >= 0 && p.v <= 100, `${p.key}: ${p.v}`));
      assert.ok(Math.abs(c.parts.reduce((a, p) => a + p.w, 0) - 1) < 1e-9);
    }
  });
  await test("aktuellt pris i annan valuta påverkar inte indexet", () => {
    const { daily, s7 } = series("up");
    const a = S.computeScores([market("solana", s7)], { solana: hist(daily) })[0].score;
    const b = S.computeScores([market("solana", s7, { current_price: 999999 })], { solana: hist(daily) })[0].score;
    assert.strictEqual(a, b);
  });
  await test("utan 90 dagars historik blir värdet preliminärt", () => {
    const { daily, s7 } = series("down");
    const pre = S.computeScores([market("solana", s7, { ch30: -30 })], {})[0];
    const full = S.computeScores([market("solana", s7, { ch30: -30 })], { solana: hist(daily) })[0];
    assert.strictEqual(pre.prelim, true);
    assert.strictEqual(full.prelim, false);
    assert.ok(pre.score <= 44, `preliminärt fall ${pre.score}`);
    const short = S.computeScores([market("solana", s7)], { solana: hist(daily.slice(-30)) })[0];
    assert.strictEqual(short.prelim, true, "30 dagars historik räcker inte");
  });
  await test("null och NaN i data hoppas över, saknad 30-dagarsförändring kraschar inte", () => {
    const { daily, s7 } = series("flat");
    const s = s7.slice(); s[10] = null; s[50] = NaN;
    const d = daily.slice(); d[5] = null;
    const c = S.computeScores([market("solana", s, { ch30: null })], { solana: hist(d) })[0];
    assert.ok(Number.isFinite(c.score));
    assert.ok(Number.isFinite(c.ch30), "30-dagarsförändringen räknas ur historiken när den saknas");
    const noHist = S.computeScores([market("solana", s7, { ch30: null })], {})[0];
    assert.strictEqual(noHist.ch30, null);
  });
  await test("mynt utan Avanza-certifikat och för korta serier filtreras bort", () => {
    const { s7 } = series("flat");
    const out = S.computeScores([market("not-on-avanza", s7), market("tron", s7.slice(0, 10))], {});
    assert.strictEqual(out.length, 0);
  });
  await test("historik: tar bort dagens punkt och väljer äldst först", () => {
    assert.deepStrictEqual(S.parseDaily({ prices: [[1, 10], [2, null], [3, 12], [4, 13]] }), [10, 12]);
    assert.deepStrictEqual(S.parseDaily([[1, "9", "11", "8", "10"], [2, "10", "12", "9", "11.5"], [3, "11", "13", "10", "12"]]), [10, 11.5], "Binance-format");
    assert.match(S.dailySource("solana").url, /binance\.com.*SOLUSDT/);
    assert.match(S.dailySource("leo-token").url, /coingecko/);
    assert.ok(Object.keys(S.BINANCE).every((id) => S.AVANZA[id]), "alla Binance-par hör till Avanza-mynt");
    const now = Date.now();
    const st = S.staleHistoryIds({ bitcoin: { at: now }, ethereum: { at: now - 30 * 3600e3 } }, now);
    assert.ok(!st.includes("bitcoin"));
    assert.strictEqual(st.at(-1), "ethereum", "mynt med gammal historik kommer efter mynt utan historik");
    assert.strictEqual(st.length, Object.keys(S.AVANZA).length - 1);
  });

  console.log("Aktier (aktiemodell " + S.STOCK_MODEL.version + ")");
  // 250 börsdagar: sidledes först, sedan trend de sista 40 dagarna
  const closes = (trend, vol = 0.015, n = 250) => Array.from({ length: n }, (_, i) => {
    const base = 100 * (i < n - 40 ? 1 : Math.exp((trend === "up" ? 1 : trend === "down" ? -1 : 0) * vol * 0.8 * (i - (n - 40))));
    return base * (1 + vol * 0.5 * Math.sin(i * 2.3));
  });
  const ts = (n) => Array.from({ length: n }, (_, i) => 1.7e9 + i * 86400);
  await test("aktie: uppgång ger girighet, fall ger rädsla, värden 0–100", () => {
    const up = S.stockScoreAt(closes("up"), 249).score, down = S.stockScoreAt(closes("down"), 249).score, flat = S.stockScoreAt(closes("flat"), 249).score;
    assert.ok(up >= 76, `uppgång ${up}`);
    assert.ok(down <= 24, `fall ${down}`);
    assert.ok(flat > down && flat < up, `sidledes ${flat}`);
    for (const v of [0.003, 0.015, 0.06]) for (const t of ["up", "down", "flat"]) { const x = S.stockScoreAt(closes(t, v), 249).score; assert.ok(Number.isInteger(x) && x >= 0 && x <= 100); }
  });
  await test("aktie: listobjekt med förändringar, historik och kort historik som saknar värde", () => {
    const c = closes("up"), it = S.stockItem(S.STOCKS[0], ts(c.length), c, { regularMarketPrice: c.at(-1), currency: "SEK" });
    assert.strictEqual(it.id, S.STOCKS[0][0]);
    assert.ok(Math.abs(it.ch24 - (c.at(-1) / c.at(-2) - 1) * 100) < 1e-9);
    assert.strictEqual(it.hist.length, 120);
    assert.strictEqual(it.hist.at(-1)[1], it.score, "sista historikpunkten är dagens värde");
    const withNull = c.slice(); withNull[100] = null;
    assert.ok(Number.isFinite(S.stockItem(S.STOCKS[0], ts(c.length), withNull, null).score), "null i kurserna hoppas över");
    const fresh = S.stockItem(S.STOCKS[0], ts(40), c.slice(-40), null);
    assert.strictEqual(fresh.prelim, true);
    assert.strictEqual(fresh.score, null);
    assert.strictEqual(S.stockItem(S.STOCKS[0], ts(3), c.slice(-3), null), null);
  });
  await test("börstid räknas i svensk tid oavsett tidszon, med sommartid", () => {
    const T = new Function(`${scoreSrc}; return { stockholmTime, stockMarketOpen };`)();
    assert.strictEqual(T.stockholmTime(new Date(Date.UTC(2026, 9, 28, 8, 30))).hour, 9.5, "vintertid (CET)");
    assert.strictEqual(T.stockholmTime(new Date(Date.UTC(2026, 6, 1, 7, 30))).hour, 9.5, "sommartid (CEST)");
    assert.strictEqual(T.stockMarketOpen(new Date(Date.UTC(2026, 9, 28, 8, 30))), true, "onsdag 09:30");
    assert.strictEqual(T.stockMarketOpen(new Date(Date.UTC(2026, 9, 28, 16, 45))), false, "onsdag 17:45");
    assert.strictEqual(T.stockMarketOpen(new Date(Date.UTC(2026, 9, 28, 16, 45)), 19), true, "efter stängning för bakgrunden");
    assert.strictEqual(T.stockMarketOpen(new Date(Date.UTC(2026, 9, 31, 10, 0))), false, "lördag");
  });
  await test("aktielistan: 302 unika aktier på Large Cap och Mid Cap", () => {
    assert.strictEqual(S.STOCKS.length, 302);
    assert.strictEqual(new Set(S.STOCKS.map((x) => x[0])).size, 302);
    assert.ok(S.STOCKS.every((x) => /\.ST$/.test(x[0]) && (x[2] === "L" || x[2] === "M") && x[3] > 0));
  });
  // Yahoo-svar i spark-format för de efterfrågade kortnamnen
  let stockTrends = {}, missing = new Set();
  const yahoo = (url) => {
    const syms = decodeURIComponent(url.match(/symbols=([^&]+)/)[1]).split(",");
    if (syms.some((x) => missing.has(x))) return { ok: false, status: 404, json: async () => ({}) };
    return { ok: true, status: 200, json: async () => ({ spark: { result: syms.map((sym) => { const c = closes(stockTrends[sym] || "flat"); return { symbol: sym, response: [{ meta: { regularMarketPrice: c.at(-1), currency: "SEK" }, timestamp: ts(c.length), indicators: { quote: [{ close: c }] } }] }; }) } }) };
  };
  await test("aktie: hämtning i grupper om 20, ogiltigt kortnamn stoppar inte resten", async () => {
    missing = new Set([S.STOCKS[5][0]]);
    let calls = 0;
    const g = new Function("fetch", "setTimeout", `${scoreSrc}; return fetchStocks;`)(async (u, o) => { calls++; assert.strictEqual(o && o.method, "GET", "bakgrundsmotorn kräver method"); return yahoo(u); }, (fn) => fn());
    const r = await g("https://yahoo.test", { retryWait: 0 });
    assert.strictEqual(r.items.length, 301);
    assert.deepStrictEqual(r.failed, [S.STOCKS[5][0]]);
    assert.ok(r.index && r.index.id === "^OMX");
    assert.ok(calls < 60, `${calls} anrop`);
    missing = new Set();
  });

  console.log("Bakgrundskörning");
  function makeRunner(responder) {
    const kv = {}, handlers = {}, sent = [];
    const env = {
      CapacitorKV: { get: (k) => ({ value: kv[k] }), set: (k, v) => { kv[k] = v; }, remove: (k) => { delete kv[k]; } },
      CapacitorNotifications: { schedule: (n) => sent.push(...n) },
      addEventListener: (e, f) => { handlers[e] = f; },
      fetch: async (url) => responder(url),
      setTimeout: (f) => f() // inga väntetider i testerna
    };
    new Function(...Object.keys(env), `${scoreSrc}\n${runnerSrc}`)(...Object.values(env));
    const run = (e, a) => new Promise((res, rej) => handlers[e](res, rej, a));
    return { kv, sent, run };
  }
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });
  // Testmarknad: trend per mynt; daglig historik serveras via market_chart-anropet
  let trends = {};
  const ids = ["bitcoin", "ethereum", "solana", "cardano", "near", "sui", "aave", "arweave", "cosmos", "tezos", "iota", "kaspa"];
  const binanceToId = Object.fromEntries(Object.entries(S.BINANCE).map(([id, sym]) => [sym, id]));
  const responder = (url) => {
    if (url.includes("finance/spark")) return yahoo(url);
    const b = url.match(/klines\?symbol=([A-Z0-9]+)/);
    if (b) { const { daily } = series(trends[binanceToId[b[1]]] || "flat"); return ok([...daily, daily[89]].map((p, i) => [i * 864e5, p, p, p, String(p)])); }
    const m = url.match(/coins\/([^/]+)\/market_chart/);
    if (m) { const { daily } = series(trends[m[1]] || "flat"); return ok({ prices: [...daily, daily[89]].map((p, i) => [i * 864e5, p]) }); }
    return ok(ids.map((id) => market(id, series(trends[id] || "flat").s7)));
  };
  const r = makeRunner(responder);
  // Lägg in 90-dagarshistorik direkt för testmynten (bakgrunden hämtar annars bara 12 mynt per körning)
  const setDaily = (runner) => { runner.kv["ks-daily"] = JSON.stringify(Object.fromEntries(ids.map((id) => [id, { at: Date.now(), daily: series(trends[id] || "flat").daily }]))); };
  const runCheck = async (runner, n = 2) => { let s; for (let i = 0; i < n; i++) s = await runner.run("checkSentiment", {}); return s; };

  await test("första körningarna hämtar historik och sparar utgångsläge utan notis", async () => {
    trends = { solana: "down" };
    const s = await runCheck(r, 1);
    assert.strictEqual(s.dailyFetched, Object.keys(S.BINANCE).length + 12, "alla Binance-mynt plus 12 från CoinGecko");
    assert.strictEqual(s.sent, 0);
    assert.ok(s.extremeFear.includes("solana"));
  });
  await test("mynt som går in i extrem rädsla ger en notis", async () => {
    trends = {}; await runCheck(r, 1);
    trends = { cardano: "down" };
    r.kv["ks-daily"] = "{}"; // tvinga ny historik med fallande trend
    const before = r.sent.length, s = await runCheck(r, 1);
    assert.strictEqual(s.sent, 1, JSON.stringify(s));
    assert.match(r.sent[before].title, /cardano är i extrem rädsla/);
    assert.ok(r.sent[before].smallIcon);
  });
  await test("samma mynt ger ingen ny notis inom 12 timmar", async () => {
    trends = {}; r.kv["ks-daily"] = "{}"; await runCheck(r, 1);
    trends = { cardano: "down" }; r.kv["ks-daily"] = "{}";
    assert.strictEqual((await runCheck(r, 1)).sent, 0);
  });
  await test("mynt som går in i extrem girighet ger en notis", async () => {
    trends = {}; r.kv["ks-daily"] = "{}"; await runCheck(r, 1);
    trends = { near: "up" }; r.kv["ks-daily"] = "{}";
    const s = await runCheck(r, 1);
    assert.strictEqual(s.sent, 1);
    assert.match(r.sent[r.sent.length - 1].title, /near är i extrem girighet/);
  });
  await test("fler än fyra mynt samtidigt ger en samlad notis", async () => {
    const many = ["aave", "arweave", "cosmos", "tezos", "iota", "kaspa"];
    trends = {}; setDaily(r); await runCheck(r, 1);
    trends = Object.fromEntries(many.map((id) => [id, "down"])); setDaily(r);
    const s = await runCheck(r, 1);
    assert.strictEqual(s.sent, 1);
    assert.match(r.sent[r.sent.length - 1].title, /^6 kryptovalutor/);
  });
  await test("preliminära värden ger aldrig notis", async () => {
    const r2 = makeRunner((url) => url.includes("market_chart") || url.includes("klines") ? { ok: false, status: 429 } : responder(url));
    trends = {}; await runCheck(r2, 1);
    trends = { solana: "down" };
    const s = await runCheck(r2, 1);
    assert.strictEqual(s.sent, 0);
    assert.strictEqual(s.coins, 0);
    assert.strictEqual(s.prelim, Object.keys(S.AVANZA).length);
  });
  await test("tyst körning och avstängda notiser skickar inget", async () => {
    const r3 = makeRunner(responder);
    trends = {}; await runCheck(r3, 1);
    trends = { sui: "down" }; r3.kv["ks-daily"] = "{}";
    assert.strictEqual((await r3.run("checkSentiment", { silent: true })).sent, 0);
    const r4 = makeRunner(responder);
    trends = {}; await runCheck(r4, 1);
    await r4.run("setNotify", { on: false });
    trends = { sui: "down" }; r4.kv["ks-daily"] = "{}";
    assert.strictEqual((await runCheck(r4, 1)).sent, 0);
    assert.strictEqual((await r4.run("getStatus", {})).notify, false);
  });
  await test("fel från CoinGecko sparas som status och behåller tidigare nivåer", async () => {
    const levelsBefore = r.kv["ks-levels-v2"];
    const rErr = makeRunner(() => ({ ok: false, status: 429 }));
    rErr.kv["ks-levels-v2"] = levelsBefore;
    await assert.rejects(rErr.run("checkSentiment", {}));
    assert.strictEqual(rErr.kv["ks-levels-v2"], levelsBefore);
    assert.match(JSON.parse(rErr.kv["ks-bg-status"]).error, /svarar/);
  });
  await test("blockerat Binance faller tillbaka på CoinGecko", async () => {
    const r6 = makeRunner((url) => url.includes("klines") ? { ok: false, status: 451 } : responder(url));
    trends = {};
    const s = await runCheck(r6, 1);
    assert.ok(s.dailyFetched >= 12, `hämtade ${s.dailyFetched}`);
    assert.ok(s.coins >= 10, `fullständiga värden för ${s.coins} testmynt`);
  });
  await test("när CoinGecko är spärrat används Binance för marknadsdata", async () => {
    const r7 = makeRunner((url) => {
      if (url.includes("coingecko")) return { ok: false, status: 429 };
      if (url.includes("ticker/24hr")) return ok(Object.values(S.BINANCE).map((sym) => ({ symbol: sym, lastPrice: "100", priceChangePercent: "1.5" })));
      return responder(url);
    });
    trends = {};
    const s = await runCheck(r7, 1);
    assert.strictEqual(s.source, "binance");
    assert.ok(s.coins >= 60, `${s.coins} mynt med fullständigt värde`);
  });
  await test("aktie som går in i extrem rädsla ger en aktienotis, högst en per 12 timmar", async () => {
    const r8 = makeRunner(responder);
    trends = {}; stockTrends = {};
    let s = await r8.run("checkSentiment", { stocks: true });
    assert.strictEqual(s.stocks.stocks, 302);
    assert.strictEqual(s.stocks.sent, 0, "första körningen är utgångsläge");
    stockTrends = { "VOLV-B.ST": "down" };
    s = await r8.run("checkSentiment", { stocks: true });
    assert.strictEqual(s.stocks.sent, 1);
    assert.match(r8.sent.at(-1).title, /^Aktien Volvo B är i extrem rädsla/);
    assert.match(r8.sent.at(-1).body, /Large Cap/);
    stockTrends = {}; await r8.run("checkSentiment", { stocks: true });
    stockTrends = { "VOLV-B.ST": "down" };
    assert.strictEqual((await r8.run("checkSentiment", { stocks: true })).stocks.sent, 0);
  });
  await test("aktienotiser kan stängas av separat från kryptonotiser", async () => {
    const r9 = makeRunner(responder);
    trends = {}; stockTrends = {};
    await r9.run("checkSentiment", { stocks: true });
    await r9.run("setNotify", { on: false, kind: "stocks" });
    stockTrends = { "SAAB-B.ST": "down" };
    assert.strictEqual((await r9.run("checkSentiment", { stocks: true })).stocks.sent, 0);
    const st = await r9.run("getStatus", {});
    assert.strictEqual(st.notifyStocks, false);
    assert.strictEqual(st.notify, true);
    assert.ok(st.stockStatus && st.stockStatus.stocks === 302);
  });
  await test("Yahoo nere ger felstatus för aktier men kryptokontrollen fungerar", async () => {
    const r10 = makeRunner((url) => url.includes("finance/spark") ? { ok: false, status: 503 } : responder(url));
    trends = {};
    const s = await r10.run("checkSentiment", { stocks: true });
    assert.ok(s.coins > 0);
    assert.match(s.stocks.error, /503/);
  });
  await test("historik delas med appen åt båda hållen, nyast vinner", async () => {
    const r5 = makeRunner(responder);
    const now = Date.now();
    await r5.run("putDaily", { daily: { bitcoin: { at: now, daily: [1, 2, 3] }, "not-on-avanza": { at: now, daily: [1] } } });
    let d = (await r5.run("getDaily", {})).daily;
    assert.deepStrictEqual(Object.keys(d), ["bitcoin"]);
    await r5.run("putDaily", { daily: { bitcoin: { at: now - 1000, daily: [9] } } });
    d = (await r5.run("getDaily", {})).daily;
    assert.deepStrictEqual(d.bitcoin.daily, [1, 2, 3]);
    const h = (await r.run("getHistory", {})).history;
    assert.ok(h.bitcoin && h.bitcoin.every(([t, v]) => Number.isFinite(t) && Number.isInteger(v)));
  });

  console.log("Kalibrering mot officiellt index");
  const stockCache = path.join(__dirname, ".cache", "spy-fear-greed.csv");
  if (fs.existsSync(stockCache) || process.argv.includes("--live")) {
    await test("S&P 500: korrelation minst 0,80 och medelavvikelse under 11 mot CNN (korsvaliderat)", async () => {
      const log = console.log; console.log = () => {};
      const r = await require("./backtest-stocks.js").run().finally(() => { console.log = log; });
      assert.ok(r.cv.corr >= 0.8 && r.cv.mae < 11, `korrelation ${r.cv.corr.toFixed(2)}, medelavvikelse ${r.cv.mae.toFixed(1)}`);
    });
  } else console.log("  hoppar över aktier (kör npm run backtest:stocks först)");
  const cache = path.join(__dirname, ".cache", "btc.json");
  if (fs.existsSync(cache) || process.argv.includes("--live")) {
    await test("Bitcoin: korrelation minst 0,85 och medelavvikelse under 10 mot alternative.me", async () => {
      const log = console.log; console.log = () => {};
      const s = await require("./backtest.js").run().finally(() => { console.log = log; });
      assert.ok(s.corr >= 0.85 && s.mae < 10, `korrelation ${s.corr.toFixed(2)}, medelavvikelse ${s.mae.toFixed(1)}`);
    });
  } else console.log("  hoppar över (kör npm run backtest först)");

  if (process.argv.includes("--live")) {
    console.log("Riktig data från CoinGecko");
    await test("alla Avanza-mynt finns hos CoinGecko och får ett index", async () => {
      const raw = await (await fetch(S.MARKETS_URL())).json();
      const out = S.computeScores(raw, {});
      const missing = Object.keys(S.AVANZA).filter((id) => !out.some((c) => c.id === id));
      assert.deepStrictEqual(missing, []);
    });
    await test("Binance-paren finns och priset stämmer med CoinGecko", async () => {
      const raw = await (await fetch(S.MARKETS_URL())).json();
      const bad = [];
      for (const [id, sym] of Object.entries(S.BINANCE)) {
        const k = await (await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=1`)).json();
        const c = raw.find((x) => x.id === id);
        if (!Array.isArray(k) || !c || Math.abs(+k[0][4] / c.current_price - 1) > 0.05) bad.push(id);
      }
      assert.deepStrictEqual(bad, []);
    });
    await test("90-dagarshistorik från CoinGecko ger ett fullständigt värde", async () => {
      const daily = S.parseDaily(await (await fetch(S.DAILY_URL("ethereum"))).json());
      assert.ok(daily.length >= 85, `${daily.length} dagar`);
      const raw = await (await fetch(S.MARKETS_URL())).json();
      const eth = S.computeScores(raw, { ethereum: { at: Date.now(), daily } }).find((c) => c.id === "ethereum");
      assert.strictEqual(eth.prelim, false);
      console.log(`       Ethereum just nu: ${eth.score} (${S.CLASSES[eth.cls]})`);
    });
  }

  console.log(`\n${passed} godkända, ${failed} fel`);
  process.exit(failed ? 1 : 0);
})();
