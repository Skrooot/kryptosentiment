// Bakgrundskörning för Android-appen (Capacitor Background Runner).
// Körs ungefär en gång i timmen även när appen är stängd. scripts/build-runner.js lägger score.js
// framför den här filen och skriver resultatet till www/runners/background.js.
//
// Varje körning räknar om indexet för alla Avanza-mynt, sparar en timmätning och jämför med förra
// körningens nivåer. Notis skickas när ett mynt går ner i extrem rädsla eller upp i extrem girighet.
// Under börsdagen (vardagar 09–19) görs samma sak för aktierna på Large Cap och Mid Cap (www/stocks.js).

// Nycklarna har modellversion i namnet: när formeln ändras börjar nivåer och historik om,
// så att bytet i sig inte ger notiser.
const KEY_LEVELS = "ks-levels-v2";
const KEY_STATUS = "ks-bg-status";
const KEY_NOTIFY = "ks-notify";
const KEY_NOTIFIED = "ks-notified";
const KEY_HISTORY = "ks-bg-history-v3";
const KEY_DAILY = "ks-daily";
const KEY_RAW = "ks-names"; // namn, ikon och rang från CoinGecko, används när Binance är reservkälla
const KEY_NOTIFY_STOCKS = "ks-notify-stocks";
const KEY_STOCK_LEVELS = "ks-levels-stocks-v1";
const KEY_STOCK_STATUS = "ks-bg-stock-status";
const YAHOO = "https://query1.finance.yahoo.com";
const DAILY_PER_RUN = 12; // högst så många CoinGecko-mynt per körning (Binance-mynten har ingen gräns här)
const SMALL_ICON = "ic_stat_sentiment"; // res/drawable/ic_stat_sentiment.xml
const MAX_SINGLE = 4; // fler mynt än så samlas i en sammanfattande notis
const QUIET_MS = 12 * 3600e3; // samma mynt och samma läge ger högst en notis per 12 timmar
const HISTORY_MS = 72 * 3600e3; // timmätningar som sparas för appens historik

function readJson(key) {
  try {
    const r = CapacitorKV.get(key);
    return r && r.value ? JSON.parse(r.value) : null;
  } catch (e) {
    return null;
  }
}

function listNames(coins) {
  return coins.map((c) => `${c.name} (${c.score})`).join(", ");
}

function buildNotices(fear, greed, kind = "crypto") {
  const stock = kind === "stocks";
  let id = Math.floor(Date.now() / 1000) % 100000000;
  const notices = [];
  if (fear.length + greed.length > MAX_SINGLE) {
    const parts = [];
    if (fear.length) parts.push(`Extrem rädsla: ${listNames(fear)}`);
    if (greed.length) parts.push(`Extrem girighet: ${listNames(greed)}`);
    notices.push({
      id: id++,
      title: `${fear.length + greed.length} ${stock ? "aktier" : "kryptovalutor"} har bytt till ett extremläge`,
      body: parts.join(". "),
      largeBody: parts.join("\n\n"),
      autoCancel: true,
      smallIcon: SMALL_ICON
    });
    return notices;
  }
  fear.forEach((c) => notices.push({
    id: id++,
    title: `${stock ? "Aktien " : ""}${c.name} är i extrem rädsla`,
    body: stock ? `Indexet har fallit till ${c.score} av 100 (${c.seg === "L" ? "Large Cap" : "Mid Cap"}).` : `Indexet har fallit till ${c.score} av 100. ${AVANZA[c.id][0]} finns som certifikat på Avanza.`,
    autoCancel: true,
    smallIcon: SMALL_ICON
  }));
  greed.forEach((c) => notices.push({
    id: id++,
    title: `${stock ? "Aktien " : ""}${c.name} är i extrem girighet`,
    body: stock ? `Indexet har stigit till ${c.score} av 100 (${c.seg === "L" ? "Large Cap" : "Mid Cap"}).` : `Indexet har stigit till ${c.score} av 100. ${AVANZA[c.id][0]} finns som certifikat på Avanza.`,
    autoCancel: true,
    smallIcon: SMALL_ICON
  }));
  return notices;
}

// Hämtar 90-dagarshistorik för de mynt som saknar den eller där den är äldre än ett dygn.
// Alla Binance-mynt hämtas direkt; CoinGecko-mynten högst DAILY_PER_RUN per körning, ett var sjätte sekund.
async function refreshDaily(daily) {
  const stale = staleHistoryIds(daily);
  const ids = stale.filter((id) => BINANCE[id]).concat(stale.filter((id) => !BINANCE[id]).slice(0, DAILY_PER_RUN));
  let fetched = 0, cgBlocked = false;
  const get = async (url) => { try { const r = await fetch(url); return r.ok ? parseDaily(await r.json()) : (r.status === 429 ? "429" : null); } catch (e) { return null; } };
  for (const id of ids) {
    const src = dailySource(id);
    let d = src.binance ? await get(src.url) : null;
    if (!(Array.isArray(d) && d.length >= 60) && !cgBlocked) { // reserv: CoinGecko (även när Binance har för kort historik)
      d = await get(DAILY_URL(id));
      if (d === "429") cgBlocked = true; // CoinGeckos gräns nådd, resten tas nästa timme
      await new Promise((res) => setTimeout(res, 6000));
    }
    if (Array.isArray(d)) {
      daily[id] = { at: d.length >= 60 ? Date.now() : Date.now() - HISTORY_MAX_AGE + 3600e3, daily: d };
      fetched++;
    }
    if (src.binance) await new Promise((res) => setTimeout(res, src.pause));
  }
  if (fetched) CapacitorKV.set(KEY_DAILY, JSON.stringify(daily));
  return fetched;
}

function saveHistory(coins, now) {
  const hist = readJson(KEY_HISTORY) || {};
  coins.forEach((c) => {
    const arr = hist[c.id] || (hist[c.id] = []);
    const last = arr[arr.length - 1];
    if (last && now - last[0] < 30 * 60 * 1000) last[1] = c.score;
    else arr.push([now, c.score]);
    while (arr.length && arr[0][0] < now - HISTORY_MS) arr.shift();
  });
  CapacitorKV.set(KEY_HISTORY, JSON.stringify(hist));
}

// Nya extremlägen sedan förra körningen, högst en notis per objekt och läge per QUIET_MS.
// prefix skiljer aktier från mynt i listan över skickade notiser.
function notifyChanges(list, prev, kind, prefix, now) {
  const notified = readJson(KEY_NOTIFIED) || {};
  const entered = (c, cls) => c.cls === cls && prev && prev[c.id] !== undefined && prev[c.id] !== cls &&
    !(notified[prefix + c.id + ":" + cls] > now - QUIET_MS);
  const fear = list.filter((c) => entered(c, 0)), greed = list.filter((c) => entered(c, 4));
  const notices = buildNotices(fear, greed, kind);
  if (notices.length) {
    CapacitorNotifications.schedule(notices);
    fear.forEach((c) => { notified[prefix + c.id + ":0"] = now; });
    greed.forEach((c) => { notified[prefix + c.id + ":4"] = now; });
    CapacitorKV.set(KEY_NOTIFIED, JSON.stringify(notified));
  }
  return notices.length;
}
// Börsdag: vardagar 09–19 svensk tid (en körning efter stängning fångar slutkurserna).
const stockHours = (d = new Date()) => stockMarketOpen(d, 19);
async function checkStocks(silent, force) {
  const now = Date.now();
  if (!force && !stockHours()) return null;
  try {
    const r = await fetchStocks(YAHOO, { headers: { "User-Agent": STOCK_UA }, pause: 600 });
    const list = r.items.filter((x) => x.score != null);
    if (!list.length) throw new Error("Inga aktiekurser i svaret");
    const prev = readJson(KEY_STOCK_LEVELS), levels = {};
    list.forEach((c) => { levels[c.id] = c.cls; });
    const sent = prev && !silent && readJson(KEY_NOTIFY_STOCKS) !== false ? notifyChanges(list, prev, "stocks", "s:", now) : 0;
    CapacitorKV.set(KEY_STOCK_LEVELS, JSON.stringify(Object.assign({}, prev || {}, levels)));
    const st = { at: now, stocks: list.length, failed: r.failed.length, sent, index: r.index && r.index.score,
      extremeFear: list.filter((c) => c.cls === 0).length, extremeGreed: list.filter((c) => c.cls === 4).length };
    CapacitorKV.set(KEY_STOCK_STATUS, JSON.stringify(st));
    return st;
  } catch (err) {
    const msg = String(err && err.message || err);
    const st = { at: now, error: msg.includes("http") ? "Ingen kontakt med Yahoo Finance" : msg.slice(0, 120) };
    CapacitorKV.set(KEY_STOCK_STATUS, JSON.stringify(st));
    return st;
  }
}

// args.silent = true används när appen själv startar en kontroll: nivåerna sparas men ingen notis skickas.
// args.stocks = true kör aktiekontrollen även utanför börstid (används av tester).
addEventListener("checkSentiment", async (resolve, reject, args) => {
  const silent = !!(args && args.silent);
  const stocksPromise = checkStocks(silent, !!(args && args.stocks));
  try {
    const m = await fetchMarkets(readJson(KEY_RAW));
    const raw = m.raw;
    if (m.source === "coingecko") CapacitorKV.set(KEY_RAW, JSON.stringify(raw.map((c) => ({ id: c.id, name: c.name, symbol: c.symbol, image: c.image, market_cap_rank: c.market_cap_rank }))));
    const daily = readJson(KEY_DAILY) || {};
    let dailyFetched = 0;
    try { dailyFetched = await refreshDaily(daily); } catch (e) { /* historiken kompletteras nästa körning */ }
    // Preliminära värden (utan 90 dagars historik) är för osäkra för notiser och sparas inte som nivåer.
    const coins = computeScores(raw, daily).filter((c) => !c.prelim);
    const now = Date.now();

    const prev = readJson(KEY_LEVELS);
    const levels = {};
    coins.forEach((c) => { levels[c.id] = c.cls; });

    // Nytt extremläge sedan förra körningen, och ingen notis om samma läge de senaste 12 timmarna
    // (annars ger ett mynt som pendlar kring gränsen en notis varje timme).
    const sent = prev && !silent && readJson(KEY_NOTIFY) !== false ? notifyChanges(coins, prev, "crypto", "", now) : 0;

    // Behåll tidigare nivå för mynt som inte kunde räknas den här gången
    CapacitorKV.set(KEY_LEVELS, JSON.stringify(Object.assign({}, prev || {}, levels)));
    saveHistory(coins, now);
    const status = {
      at: now,
      coins: coins.length,
      prelim: Object.keys(AVANZA).length - coins.length,
      dailyFetched,
      sent,
      source: m.source,
      extremeFear: coins.filter((c) => c.cls === 0).map((c) => c.name),
      extremeGreed: coins.filter((c) => c.cls === 4).map((c) => c.name)
    };
    CapacitorKV.set(KEY_STATUS, JSON.stringify(status));
    status.stocks = await stocksPromise;
    resolve(status);
  } catch (err) {
    await stocksPromise;
    // Kort, läsbart fel (fetch-fel i bakgrundsmotorn innehåller annars hela adressen)
    const msg = String(err && err.message || err);
    CapacitorKV.set(KEY_STATUS, JSON.stringify({ at: Date.now(), error: msg.includes("http") ? "Ingen kontakt med datakällorna" : msg.slice(0, 120) }));
    reject(err);
  }
});

// Appen läser senaste bakgrundskörningen, timhistoriken och slår på eller av notiser.
addEventListener("getStatus", (resolve) => {
  resolve({ status: readJson(KEY_STATUS), notify: readJson(KEY_NOTIFY) !== false,
    stockStatus: readJson(KEY_STOCK_STATUS), notifyStocks: readJson(KEY_NOTIFY_STOCKS) !== false });
});

addEventListener("getHistory", (resolve) => {
  resolve({ history: readJson(KEY_HISTORY) || {} });
});

addEventListener("getDaily", (resolve) => {
  resolve({ daily: readJson(KEY_DAILY) || {} });
});

// Appen skickar historik den själv har hämtat. Nyast vinner per mynt.
addEventListener("putDaily", (resolve, reject, args) => {
  const mine = readJson(KEY_DAILY) || {}, theirs = (args && args.daily) || {};
  let n = 0;
  Object.keys(theirs).forEach((id) => {
    if (AVANZA[id] && Array.isArray(theirs[id].daily) && (theirs[id].at || 0) > ((mine[id] && mine[id].at) || 0)) { mine[id] = theirs[id]; n++; }
  });
  if (n) CapacitorKV.set(KEY_DAILY, JSON.stringify(mine));
  resolve({ updated: n });
});

// args.kind: "crypto" (standard) eller "stocks"
addEventListener("setNotify", (resolve, reject, args) => {
  const on = !!(args && args.on), key = args && args.kind === "stocks" ? KEY_NOTIFY_STOCKS : KEY_NOTIFY;
  CapacitorKV.set(key, JSON.stringify(on));
  resolve({ notify: on, kind: (args && args.kind) || "crypto" });
});
