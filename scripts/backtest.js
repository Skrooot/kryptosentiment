// Backtest: kör appens egen modell (www/score.js) för Bitcoin dag för dag och jämför med alternative.me:s Fear & Greed.
// Kör: npm run backtest   (hämtar knappt ett års timdata från CoinGecko första gången, cachas i scripts/.cache)
//      npm run backtest -- --refit   (räknar även fram ny kalibrering med blockvis korsvalidering)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const S = new Function(`${fs.readFileSync(path.join(root, "www", "score.js"), "utf8")}; return { MODEL, modelFeatures, modelScore, fallbackFeatures, classIdx, clamp };`)();
const cacheDir = path.join(__dirname, ".cache");
const H = 3600e3, D = 864e5;

async function loadData() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const file = path.join(cacheDir, "btc.json");
  if (fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 12 * H) return JSON.parse(fs.readFileSync(file, "utf8"));
  const now = Math.floor(Date.now() / 1000), prices = [];
  for (let k = 3; k >= 0; k--) { // fyra fönster à 86 dagar ger timdata (gratis-API:t tillåter max 365 dagar bakåt)
    const to = now - k * 86 * 86400, from = to - 86 * 86400;
    const r = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart/range?vs_currency=usd&from=${from}&to=${to}`);
    if (!r.ok) throw new Error(`CoinGecko svarade ${r.status}`);
    prices.push(...(await r.json()).prices);
    await new Promise((res) => setTimeout(res, 4000));
  }
  const seen = new Set();
  const P = prices.filter((p) => !seen.has(p[0]) && seen.add(p[0])).sort((a, b) => a[0] - b[0]);
  const fng = (await (await fetch("https://api.alternative.me/fng/?limit=400")).json()).data.map((x) => [x.timestamp * 1000, +x.value]).sort((a, b) => a[0] - b[0]);
  const data = { P, fng };
  fs.writeFileSync(file, JSON.stringify(data));
  return data;
}

const corr = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n; let c = 0, va = 0, vb = 0; for (let i = 0; i < n; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
function fit(xs, ys) { const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n; let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } const b = sxy / sxx; return { a: my - b * mx, b }; }
function stats(pred, off) {
  const n = pred.length;
  return {
    n, corr: corr(pred, off),
    mae: pred.reduce((s, p, i) => s + Math.abs(p - off[i]), 0) / n,
    bias: pred.reduce((s, p, i) => s + p - off[i], 0) / n,
    same: pred.filter((p, i) => S.classIdx(p) === S.classIdx(off[i])).length / n,
    near: pred.filter((p, i) => Math.abs(S.classIdx(p) - S.classIdx(off[i])) <= 1).length / n
  };
}
const show = (label, s) => console.log(`${label.padEnd(34)} korrelation ${s.corr.toFixed(2)}  medelavvikelse ${s.mae.toFixed(1)}  snittfel ${s.bias >= 0 ? "+" : ""}${s.bias.toFixed(1)}  samma nivå ${(s.same * 100).toFixed(0)} %  ±1 nivå ${(s.near * 100).toFixed(0)} %  (${s.n} dagar)`);

async function run() {
  const { P, fng } = await loadData();
  const T = P.map((x) => x[0]), V = P.map((x) => x[1]);
  const idxAt = (t) => { let lo = 0, hi = T.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (T[m] <= t) lo = m; else hi = m - 1; } return lo; };
  const rows = [];
  for (const [t, off] of fng) {
    const i = idxAt(t);
    if (T[i] < t - 2 * H || T[i] - T[0] < 92 * D) continue;
    const daily = []; for (let k = 90; k >= 1; k--) daily.push(V[idxAt(t - k * D)]); // 90 stängningar före dagen, som i appen
    const s7 = V.slice(i - 167, i + 1), p = V[i];
    const f = S.modelFeatures(daily, s7, p);
    const m = S.modelScore(f);
    const ch30 = (p / V[idxAt(t - 30 * D)] - 1) * 100;
    rows.push({ t, off, score: m.score, raw: (m.score - S.MODEL.calib.a) / S.MODEL.calib.b, prelim: S.modelScore(S.fallbackFeatures(s7, ch30, p)).score, f });
  }
  const off = rows.map((r) => r.off);
  console.log(`Bitcoin ${new Date(rows[0].t).toISOString().slice(0, 10)} – ${new Date(rows.at(-1).t).toISOString().slice(0, 10)}, modell ${S.MODEL.version}`);
  const main = stats(rows.map((r) => r.score), off);
  show("Appens modell", main);
  show("Preliminärt läge (utan historik)", stats(rows.map((r) => r.prelim), off));

  if (process.argv.includes("--refit")) {
    // Råvärde före kalibrering, oavrundat
    const raw = rows.map((r) => { const w = S.MODEL.weights, k = S.MODEL.k, f = r.f, sg = (x) => 1 / (1 + Math.exp(-x));
      return w.long * 100 * sg(k.long * f.zLong) + w.range * 100 * f.pos + w.mid * 100 * sg(k.mid * f.zMid) + w.short * (50 * sg(k.short * f.zShort) + 0.5 * f.rsi); });
    const n = raw.length, K = 6, pred = new Array(n);
    for (let k = 0; k < K; k++) {
      const a = Math.floor(k * n / K), b = Math.floor((k + 1) * n / K);
      const tr = [...Array(n).keys()].filter((i) => i < a - 7 || i >= b + 7);
      const c = fit(tr.map((i) => raw[i]), tr.map((i) => off[i]));
      for (let i = a; i < b; i++) pred[i] = Math.round(S.clamp(c.a + c.b * raw[i]));
    }
    show("Korsvaliderad (6 block)", stats(pred, off));
    const full = fit(raw, off);
    console.log(`Kalibrering på alla dagar: a = ${full.a.toFixed(1)}, b = ${full.b.toFixed(2)} (i appen nu: a = ${S.MODEL.calib.a}, b = ${S.MODEL.calib.b})`);
  }
  console.log("\nMånad     officiellt  appen");
  const by = {}; rows.forEach((r) => { const k = new Date(r.t).toISOString().slice(0, 7); (by[k] ||= []).push(r); });
  for (const [k, rs] of Object.entries(by)) console.log(`${k}   ${(rs.reduce((a, r) => a + r.off, 0) / rs.length).toFixed(0).padStart(5)}   ${(rs.reduce((a, r) => a + r.score, 0) / rs.length).toFixed(0).padStart(5)}`);
  return main;
}
module.exports = { run };
if (require.main === module) run().catch((e) => { console.error(e.message); process.exit(1); });
