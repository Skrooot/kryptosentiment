// Delad indexberäkning. Används av index.html (webbappen) och av Android-appens bakgrundskörning.
// Ingen DOM-åtkomst här, så filen kan köras i bakgrundsmiljön utan webbläsare.
const CG = "https://api.coingecko.com/api/v3";
const FNG = "https://api.alternative.me/fng/?limit=60";
const MARKETS_URL = () => `${CG}/coins/markets?vs_currency=usd&ids=${Object.keys(AVANZA).join(",")}&order=market_cap_desc&per_page=250&sparkline=true&price_change_percentage=24h,7d,30d`;
// 90 dagliga stängningskurser per mynt. Hämtas en gång per dygn och mynt (se HISTORY_MAX_AGE).
// Binance används där myntet finns (generös anropsgräns), annars CoinGecko i lugn takt.
const DAILY_URL = (id) => `${CG}/coins/${encodeURIComponent(id)}/market_chart?vs_currency=usd&days=90&interval=daily`;
// CoinGecko-id → Binance USDT-par. Kontrollerat 26 okt 2026 att Binance-priset ligger inom 3 % av CoinGeckos,
// och att 90 dagars historik från båda ger samma index.
const BINANCE = {
  "bitcoin": "BTCUSDT", "ethereum": "ETHUSDT", "binancecoin": "BNBUSDT", "ripple": "XRPUSDT", "solana": "SOLUSDT", "tron": "TRXUSDT",
  "zcash": "ZECUSDT", "hyperliquid": "HYPEUSDT", "dogecoin": "DOGEUSDT", "chainlink": "LINKUSDT", "cardano": "ADAUSDT", "stellar": "XLMUSDT",
  "near": "NEARUSDT", "bitcoin-cash": "BCHUSDT", "uniswap": "UNIUSDT", "litecoin": "LTCUSDT", "avalanche-2": "AVAXUSDT", "sui": "SUIUSDT",
  "the-open-network": "GRAMUSDT", "hedera-hashgraph": "HBARUSDT", "quant-network": "QNTUSDT", "shiba-inu": "SHIBUSDT", "bittensor": "TAOUSDT", "ethena": "ENAUSDT",
  "aave": "AAVEUSDT", "ondo-finance": "ONDOUSDT", "pepe": "PEPEUSDT", "polkadot": "DOTUSDT", "worldcoin-wld": "WLDUSDT", "sky": "SKYUSDT",
  "internet-computer": "ICPUSDT", "arbitrum": "ARBUSDT", "polygon-ecosystem-token": "POLUSDT", "algorand": "ALGOUSDT", "jupiter-exchange-solana": "JUPUSDT", "render-token": "RENDERUSDT",
  "cosmos": "ATOMUSDT", "injective-protocol": "INJUSDT", "filecoin": "FILUSDT", "aptos": "APTUSDT", "pyth-network": "PYTHUSDT", "blockstack": "STXUSDT",
  "aerodrome-finance": "AEROUSDT", "vechain": "VETUSDT", "curve-dao-token": "CRVUSDT", "celestia": "TIAUSDT", "virtual-protocol": "VIRTUALUSDT", "fetch-ai": "FETUSDT",
  "starknet": "STRKUSDT", "sei-network": "SEIUSDT", "pendle": "PENDLEUSDT", "tezos": "XTZUSDT", "lido-dao": "LDOUSDT", "optimism": "OPUSDT",
  "the-graph": "GRTUSDT", "arweave": "ARUSDT", "floki": "FLOKIUSDT", "thorchain": "RUNEUSDT", "iota": "IOTAUSDT", "theta-token": "THETAUSDT",
  "immutable-x": "IMXUSDT", "four": "FORMUSDT", "wormhole": "WUSDT", "mantra": "MANTRAUSDT"
};
function dailySource(id) {
  return BINANCE[id]
    ? { url: `https://api.binance.com/api/v3/klines?symbol=${BINANCE[id]}&interval=1d&limit=91`, binance: true, pause: 300 }
    : { url: DAILY_URL(id), binance: false, pause: 6000 };
}
const HISTORY_MAX_AGE = 20 * 3600e3;
// Kryptovalutor som har certifikat/ETP på Avanza (Avanzas certifikatlista, kategori Kryptovaluta, 25 okt 2026).
// CoinGecko-id → [namn hos Avanza, antal certifikat]. Index, stETH, XAUt och Story (IP, saknar säker träff hos CoinGecko) är utelämnade.
const AVANZA_DATE = "25 okt 2026";
const AVANZA = {
  "bitcoin": ["Bitcoin", 98], "ethereum": ["Ether", 76], "solana": ["Solana", 15], "ripple": ["XRP", 8],
  "cardano": ["Cardano", 7], "avalanche-2": ["Avalanche", 6], "polkadot": ["Polkadot", 6], "hyperliquid": ["Hyperliquid (HYPE)", 6],
  "chainlink": ["Chainlink", 5], "litecoin": ["Litecoin", 5], "binancecoin": ["Binance (BNB)", 4], "near": ["NEAR", 4],
  "polygon-ecosystem-token": ["Polygon", 4], "stellar": ["Stellar", 4], "uniswap": ["Uniswap", 4], "algorand": ["Algorand", 3],
  "bittensor": ["Bittensor (TAO)", 3], "sui": ["Sui", 3], "aptos": ["Aptos (APT)", 2], "arbitrum": ["Arbitrum", 2],
  "bitcoin-cash": ["Bitcoin Cash", 2], "celestia": ["Celestia (TIA)", 2], "internet-computer": ["Internet Computer", 2],
  "tezos": ["Tezos", 2], "zcash": ["Zcash (ZEC)", 2], "aave": ["Aave (AAVE)", 1], "aerodrome-finance": ["Aerodrome Finance (AERO)", 1],
  "akash-network": ["Akash Network (AKT)", 1], "fetch-ai": ["Artificial Superintelligence Alliance (FET)", 1], "arweave": ["Arweave (AR)", 1],
  "canton-network": ["Canton Coin (CC)", 1], "coredaoorg": ["Core Blockchain", 1], "cosmos": ["Cosmos", 1], "crypto-com-chain": ["Cronos (CRO)", 1],
  "curve-dao-token": ["Curve DAO (CRV)", 1], "dogecoin": ["Dogecoin", 1], "ethena": ["Ethena (ENA)", 1], "floki": ["FLOKI", 1],
  "fantom": ["Fantom (FTM)", 1], "filecoin": ["Filecoin (FIL)", 1], "flare-networks": ["Flare (FLR)", 1], "four": ["Four (FORM)", 1],
  "hedera-hashgraph": ["Hedera", 1], "iota": ["IOTA", 1], "immutable-x": ["Immutable (IMX)", 1], "injective-protocol": ["Injective (INJ)", 1],
  "jupiter-exchange-solana": ["Jupiter (JUP)", 1], "kaspa": ["Kaspa (KAS)", 1], "lido-dao": ["Lido DAO (LDO)", 1], "lighter": ["Lighter (LIT)", 1],
  "mantle": ["Mantle (MNT)", 1], "mantra": ["Mantra (OM)", 1], "okb": ["OKX (OKB)", 1], "ondo-finance": ["Ondo (ONDO)", 1],
  "optimism": ["Optimism (OP)", 1], "pendle": ["Pendle (PENDLE)", 1], "pepe": ["Pepe (PEPE)", 1], "pi-network": ["Pi Network (PI)", 1],
  "pyth-network": ["Pyth Network (PYTH)", 1], "quant-network": ["Quant (QNT)", 1], "render-token": ["Render (RENDER)", 1], "sei-network": ["Sei (SEI)", 1],
  "shiba-inu": ["Shiba Inu (SHIB)", 1], "sky": ["Sky Protocol (SKY)", 1], "blockstack": ["Stacks (STX)", 1], "starknet": ["Starknet (STRK)", 1],
  "thorchain": ["THORChain (RUNE)", 1], "tron": ["TRON", 1], "the-graph": ["The Graph (GRT)", 1],
  "theta-token": ["Theta Network (THETA)", 1], "the-open-network": ["Toncoin", 1], "leo-token": ["UNUS SED LEO (LEO)", 1], "vechain": ["VeChain (VET)", 1],
  "virtual-protocol": ["Virtuals Protocol (VIRTUAL)", 1], "worldcoin-wld": ["Worldcoin (WLD)", 1], "wormhole": ["Wormhole (W)", 1]
};
const AVANZA_LIST_URL = "https://www.avanza.se/borshandlade-produkter/certifikat-torg/lista.html";
const CLASSES = ["Extrem rädsla", "Rädsla", "Neutral", "Girighet", "Extrem girighet"];
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const sigmoid = (x) => 1 / (1 + Math.exp(-x));
const classIdx = (v) => v < 25 ? 0 : v < 45 ? 1 : v <= 55 ? 2 : v <= 75 ? 3 : 4;
const sdev = (r) => { const m = r.reduce((a, b) => a + b, 0) / r.length; return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)); };

/* ---------- Indexberäkning per mynt (modell 2) ----------
   Kalibrerad mot alternative.me:s Fear & Greed för Bitcoin, nov 2025 – okt 2026 (224 dagar).
   Blockvis korsvalidering: korrelation 0,83, medelavvikelse 10,5, samma nivå 51 %, samma eller intilliggande nivå 97 %.
   Rörelser mäts i myntets egen dagsvolatilitet, så att samma formel fungerar för lugna och svängiga mynt.
   Kör om scripts/backtest.js efter ändringar här. */
const MODEL = {
  version: 2,
  weights: { long: 0.7, range: 0.1, mid: 0.1, short: 0.1 },
  k: { long: 0.5, mid: 0.5, short: 0.5 },
  calib: { a: -35.9, b: 1.41 } // index = a + b · viktad summa
};

function rsi(series, period = 14) {
  if (series.length <= period) return 50;
  let gain = 0, loss = 0;
  for (let i = 1; i <= period; i++) { const d = series[i] - series[i - 1]; d >= 0 ? gain += d : loss -= d; }
  gain /= period; loss /= period;
  for (let i = period + 1; i < series.length; i++) {
    const d = series[i] - series[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  return 100 - 100 / (1 + gain / loss);
}

// daily: dagliga stängningskurser (äldst först, minst 60), s7: timpriser senaste veckan, p: aktuellt pris. Allt i USD.
function modelFeatures(daily, s7, p) {
  const r = daily.slice(1).map((x, i) => Math.log(x / daily[i]));
  const sigD = Math.max(sdev(r), 0.003); // golv så att nästan stillastående mynt inte ger orimliga z-värden
  const ma = daily.reduce((a, b) => a + b, 0) / daily.length;
  const hi = Math.max(...daily, p), lo = Math.min(...daily, p);
  const p30 = daily[Math.max(0, daily.length - 30)];
  return {
    zLong: Math.log(p / ma) / (sigD * Math.sqrt(30)),
    pos: hi > lo ? (p - lo) / (hi - lo) : 0.5,
    zMid: Math.log(p / p30) / (sigD * Math.sqrt(30)),
    zShort: Math.log(p / s7[0]) / (sigD * Math.sqrt(7)),
    rsi: rsi(s7.filter((_, i) => i % 4 === 3)),
    sigD, days: daily.length
  };
}
function modelScore(f) {
  const w = MODEL.weights, k = MODEL.k;
  const v = {
    long: 100 * sigmoid(k.long * f.zLong),
    range: 100 * f.pos,
    mid: 100 * sigmoid(k.mid * f.zMid),
    short: 50 * sigmoid(k.short * f.zShort) + 0.5 * f.rsi
  };
  const raw = w.long * v.long + w.range * v.range + w.mid * v.mid + w.short * v.short;
  return { v, score: Math.round(clamp(MODEL.calib.a + MODEL.calib.b * raw)) };
}

// Utan 90 dagars historik (t.ex. första minuterna efter installation): uppskatta med 30-dagarsförändringen
// och veckans timdata. Markeras som preliminärt och ger aldrig notiser.
function fallbackFeatures(s7, ch30, p) {
  const r = s7.slice(1).map((x, i) => Math.log(x / s7[i]));
  const sigD = Math.max(sdev(r) * Math.sqrt(24), 0.003);
  const z30 = Math.log(1 + (ch30 ?? 0) / 100) / (sigD * Math.sqrt(30));
  const hi = Math.max(...s7), lo = Math.min(...s7);
  return { zLong: z30 * 0.8, pos: hi > lo ? (p - lo) / (hi - lo) : 0.5, zMid: z30, zShort: Math.log(p / s7[0]) / (sigD * Math.sqrt(7)), rsi: rsi(s7.filter((_, i) => i % 4 === 3)), sigD, days: 0 };
}

const fmtZ = (z) => `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(1)}`;
// raw: CoinGecko /coins/markets i USD. histories: { id: { at, daily: [stängningskurser] } }.
function computeScores(raw, histories = {}) {
  return raw.filter((c) => AVANZA[c.id]).map((c) => {
    const s7 = (c.sparkline_in_7d?.price || []).filter((p) => Number.isFinite(p) && p > 0);
    if (s7.length < 24) return null;
    const p = s7[s7.length - 1];
    const h = histories[c.id];
    const daily = h && Array.isArray(h.daily) ? h.daily.filter((x) => Number.isFinite(x) && x > 0) : [];
    const prelim = daily.length < 60;
    const ch24 = c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0;
    const ch7 = c.price_change_percentage_7d_in_currency ?? 0;
    // 30-dagarsförändring: från CoinGecko, annars räknad ur 90-dagarshistoriken (t.ex. när Binance är reservkälla)
    const ch30 = c.price_change_percentage_30d_in_currency ?? (daily.length >= 30 ? (p / daily[daily.length - 30] - 1) * 100 : null);
    const f = prelim ? fallbackFeatures(s7, ch30, p) : modelFeatures(daily, s7, p);
    const { v, score } = modelScore(f);
    const w = MODEL.weights;
    const parts = [
      { key: "Trend mot 90-dagarssnittet", w: w.long, v: v.long, note: prelim ? "Uppskattad, 90 dagars historik hämtas" : `${fmtZ(f.zLong)} månadsvolatiliteter från snittet` },
      { key: "Läge i 90-dagarsintervallet", w: w.range, v: v.range, note: `${Math.round(f.pos * 100)} % från botten mot toppen` + (prelim ? " (veckan)" : "") },
      { key: "Momentum 30 dagar", w: w.mid, v: v.mid, note: ch30 == null ? "Saknas" : `${ch30.toFixed(1)} %, ${fmtZ(f.zMid)} i myntets egen volatilitet` },
      { key: "Kort sikt (7 d och RSI)", w: w.short, v: v.short, note: `7 d ${ch7.toFixed(1)} %, RSI ${f.rsi.toFixed(0)}` }
    ];
    return {
      id: c.id, name: c.name, symbol: c.symbol, image: c.image, rank: c.market_cap_rank ?? 9999,
      price: c.current_price, ch24, ch7, ch30, spark: s7, score, cls: classIdx(score), parts, prelim
    };
  }).filter(Boolean);
}

// Vilka mynt som behöver ny 90-dagarshistorik, äldst först.
function staleHistoryIds(histories, now = Date.now()) {
  return Object.keys(AVANZA)
    .map((id) => [id, histories[id] && histories[id].at || 0])
    .filter(([, at]) => now - at > HISTORY_MAX_AGE)
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => id);
}
// CoinGecko market_chart (interval=daily) eller Binance klines (1d) → stängningskurser, äldst först.
// Sista punkten är dagens pågående dag och tas bort.
function parseDaily(json) {
  const raw = Array.isArray(json) ? json.map((k) => +k[4]) : (json && json.prices || []).map((x) => x[1]);
  return raw.filter((x) => Number.isFinite(x) && x > 0).slice(0, -1).slice(-90);
}

// Marknadsdata i CoinGeckos format (/coins/markets, USD). Om CoinGecko inte svarar (spärr eller nätverksfel)
// byggs den från Binance för de mynt som finns där; namn, ikon och rang tas då från förra lyckade hämtningen.
async function fetchMarkets(previous) {
  try {
    const r = await fetch(MARKETS_URL());
    if (r.ok) { const j = await r.json(); if (Array.isArray(j) && j.length) return { raw: j, source: "coingecko" }; }
  } catch (e) { /* prova Binance */ }
  return { raw: await binanceMarkets(previous), source: "binance" };
}
async function binanceMarkets(previous) {
  const prev = {};
  (previous || []).forEach((c) => { prev[c.id] = c; });
  const ids = Object.keys(BINANCE);
  const syms = encodeURIComponent(JSON.stringify(ids.map((id) => BINANCE[id])));
  const tr = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${syms}`);
  const tick = tr.ok ? await tr.json() : null;
  if (!Array.isArray(tick)) throw new Error("Varken CoinGecko eller Binance svarar just nu");
  const bySym = {};
  tick.forEach((t) => { bySym[t.symbol] = t; });
  const spark = {};
  for (let i = 0; i < ids.length; i += 8) { // 8 parallella anrop åt gången
    await Promise.all(ids.slice(i, i + 8).map(async (id) => {
      try {
        const k = await (await fetch(`https://api.binance.com/api/v3/klines?symbol=${BINANCE[id]}&interval=1h&limit=168`)).json();
        spark[id] = Array.isArray(k) ? k.map((x) => +x[4]) : [];
      } catch (e) { spark[id] = []; }
    }));
  }
  return ids.filter((id) => bySym[BINANCE[id]]).map((id) => {
    const t = bySym[BINANCE[id]], p = +t.lastPrice, s7 = spark[id] || [], pc = prev[id] || {};
    return {
      id, name: pc.name || AVANZA[id][0], symbol: pc.symbol || BINANCE[id].replace(/USDT$/, "").toLowerCase(),
      image: pc.image || "", market_cap_rank: pc.market_cap_rank ?? null, current_price: p,
      price_change_percentage_24h_in_currency: +t.priceChangePercent,
      price_change_percentage_7d_in_currency: s7.length ? (p / s7[0] - 1) * 100 : null,
      price_change_percentage_30d_in_currency: null,
      sparkline_in_7d: { price: s7 }
    };
  });
}
