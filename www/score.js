// Delad indexberäkning. Används av index.html (webbappen) och av Android-appens bakgrundskörning.
// Ingen DOM-åtkomst här, så filen kan köras i bakgrundsmiljön utan webbläsare.
const CG = "https://api.coingecko.com/api/v3";
const FNG = "https://api.alternative.me/fng/?limit=60";
const MARKETS_URL = () => `${CG}/coins/markets?vs_currency=usd&ids=${Object.keys(AVANZA).join(",")}&order=market_cap_desc&per_page=250&sparkline=true&price_change_percentage=24h,7d,30d`;
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
const logistic = (x, s) => 100 / (1 + Math.exp(-x / s));
const classIdx = (v) => v < 25 ? 0 : v < 45 ? 1 : v <= 55 ? 2 : v <= 75 ? 3 : 4;
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0; };
/* ---------- Indexberäkning per mynt ---------- */
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
function hourlyVol(series) {
  const r = [];
  for (let i = 1; i < series.length; i++) if (series[i - 1] > 0 && series[i] > 0) r.push(Math.log(series[i] / series[i - 1]));
  if (r.length < 2) return 0;
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1));
}
// raw ska vara CoinGecko /coins/markets med vs_currency=usd. Sparklinjen levereras alltid i USD,
// så allt räknas i USD för att indexet ska bli detsamma oavsett vilken valuta appen visar priser i.
function computeScores(raw) {
  const coins = raw.filter((c) => {
    if (!AVANZA[c.id]) return false;
    c._s = (c.sparkline_in_7d?.price || []).filter((p) => Number.isFinite(p) && p > 0);
    return c._s.length > 24;
  });
  coins.forEach((c) => {
    c._vol = hourlyVol(c._s);
    c._turn = c.market_cap > 0 ? c.total_volume / c.market_cap : 0;
  });
  const medVol = median(coins.map((c) => c._vol).filter((v) => v > 0)) || 1e-9;
  const medTurn = median(coins.map((c) => c._turn).filter((v) => v > 0)) || 1e-9;
  const btc = raw.find((c) => c.id === "bitcoin");
  const btc7 = btc?.price_change_percentage_7d_in_currency ?? 0;

  return coins.map((c) => {
    const s = c._s;
    const ch24 = c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h ?? 0;
    const ch7 = c.price_change_percentage_7d_in_currency ?? 0;
    const ch30 = c.price_change_percentage_30d_in_currency ?? ch7;

    const momentum = logistic(0.3 * ch24 + 0.4 * ch7 + 0.3 * (ch30 / 2), 6);
    const fourH = s.filter((_, i) => i % 4 === 0);
    if ((s.length - 1) % 4 !== 0) fourH.push(s[s.length - 1]);
    const rsiV = rsi(fourH, 14);
    const volRatio = c._vol / medVol;
    const volatility = clamp(50 - 30 * Math.log2(Math.max(volRatio, 0.05)), 5, 95);
    const mn = Math.min(...s), mx = Math.max(...s);
    const range = mx > mn ? clamp((s[s.length - 1] - mn) / (mx - mn) * 100) : 50;
    const turnRatio = c._turn / medTurn;
    const volumeStrength = turnRatio > 1 ? Math.min(40, 20 * Math.log2(turnRatio)) : 0;
    const volume = clamp(50 + Math.sign(ch24) * volumeStrength * Math.min(1, Math.abs(ch24) / 2));
    const relative = c.id === "bitcoin" ? 50 : logistic(ch7 - btc7, 5);

    const parts = [
      { key: "Momentum", w: 0.25, v: momentum, note: `24 h ${ch24.toFixed(1)} %, 7 d ${ch7.toFixed(1)} %, 30 d ${ch30.toFixed(1)} %` },
      { key: "RSI (4 h)", w: 0.20, v: rsiV, note: `RSI ${rsiV.toFixed(0)}` },
      { key: "Volatilitet", w: 0.20, v: volatility, note: `${volRatio.toFixed(2).replace(".", ",")}× medianmyntets volatilitet` },
      { key: "Läge i veckans intervall", w: 0.15, v: range, note: `${range.toFixed(0)} % från veckans botten mot toppen` },
      { key: "Volym", w: 0.10, v: volume, note: `Omsättning ${turnRatio.toFixed(2).replace(".", ",")}× median` },
      { key: "Styrka mot Bitcoin", w: 0.10, v: relative, note: c.id === "bitcoin" ? "Referensmynt" : `${(ch7 - btc7).toFixed(1)} procentenheter mot BTC på 7 d` }
    ];
    const score = Math.round(clamp(parts.reduce((a, p) => a + p.w * p.v, 0)));
    return {
      id: c.id, name: c.name, symbol: c.symbol, image: c.image, rank: c.market_cap_rank ?? 9999,
      price: c.current_price, ch24, ch7, ch30: c.price_change_percentage_30d_in_currency, spark: s,
      score, cls: classIdx(score), parts
    };
  });
}
