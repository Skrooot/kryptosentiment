// Backtest för aktiemodellen: kör appens egen kod (www/stocks.js) på S&P 500 (SPY) dag för dag och jämför med
// CNN:s Fear & Greed. Data: öppet dataset github.com/hackingthemarkets/sentiment-fear-and-greed (2011–2020),
// hämtas till scripts/.cache första gången.
// Kör: npm run backtest:stocks   (lägg till -- --refit för att räkna fram kalibreringen igen)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "www", "score.js"), "utf8") + "\n" + fs.readFileSync(path.join(root, "www", "stocks.js"), "utf8");
const S = new Function(`${src}; return { STOCK_MODEL, STOCK_MIN_CLOSES, stockScoreAt, classIdx };`)();
const DATA_URL = "https://raw.githubusercontent.com/hackingthemarkets/sentiment-fear-and-greed/master/datasets/spy-put-call-fear-greed-vix.csv";

async function loadRows() {
  const file = path.join(__dirname, ".cache", "spy-fear-greed.csv");
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const r = await fetch(DATA_URL);
    if (!r.ok) throw new Error(`GitHub svarade ${r.status}`);
    fs.writeFileSync(file, await r.text());
  }
  return fs.readFileSync(file, "utf8").trim().split(/\r?\n/).slice(1)
    .map((l) => { const c = l.split(","); return { date: c[0], close: +c[4], fg: +c[8] }; })
    .filter((r) => r.close > 0 && Number.isFinite(r.fg));
}
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const corr = (a, b) => { const ma = mean(a), mb = mean(b); let c = 0, va = 0, vb = 0; for (let i = 0; i < a.length; i++) { c += (a[i] - ma) * (b[i] - mb); va += (a[i] - ma) ** 2; vb += (b[i] - mb) ** 2; } return c / Math.sqrt(va * vb); };
function fit(xs, ys) { const mx = mean(xs), my = mean(ys); let sxy = 0, sxx = 0; for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; } const b = sxy / sxx; return { a: my - b * mx, b }; }
function stats(p, o) {
  return { n: p.length, corr: corr(p, o), mae: mean(p.map((x, i) => Math.abs(x - o[i]))),
    same: mean(p.map((x, i) => S.classIdx(x) === S.classIdx(o[i]) ? 1 : 0)), near: mean(p.map((x, i) => Math.abs(S.classIdx(x) - S.classIdx(o[i])) <= 1 ? 1 : 0)) };
}
const show = (label, s) => console.log(`${label.padEnd(30)} korrelation ${s.corr.toFixed(2)}  medelavvikelse ${s.mae.toFixed(1)}  samma nivå ${(s.same * 100).toFixed(0)} %  ±1 nivå ${(s.near * 100).toFixed(0)} %  (${s.n} dagar)`);

async function run() {
  const rows = await loadRows();
  const C = rows.map((r) => r.close);
  const idx = []; for (let i = S.STOCK_MIN_CLOSES + 40; i < C.length; i++) idx.push(i);
  const res = idx.map((i) => S.stockScoreAt(C, i)), off = idx.map((i) => rows[i].fg);
  console.log(`S&P 500 (SPY) ${rows[idx[0]].date} – ${rows.at(-1).date}, aktiemodell ${S.STOCK_MODEL.version}`);
  const main = stats(res.map((r) => r.score), off);
  show("Appens aktiemodell", main);
  // Blockvis korsvalidering av kalibreringen (6 block, 10 dagars buffert)
  const raw = res.map((r) => r.raw), n = raw.length, pred = new Array(n);
  for (let k = 0; k < 6; k++) {
    const a = Math.floor(k * n / 6), b = Math.floor((k + 1) * n / 6);
    const tr = [...Array(n).keys()].filter((i) => i < a - 10 || i >= b + 10);
    const c = fit(tr.map((i) => raw[i]), tr.map((i) => off[i]));
    for (let i = a; i < b; i++) pred[i] = Math.round(Math.max(0, Math.min(100, c.a + c.b * raw[i])));
  }
  const cvs = stats(pred, off);
  show("Korsvaliderad (6 block)", cvs);
  if (process.argv.includes("--refit")) { const f = fit(raw, off); console.log(`Kalibrering på alla dagar: a = ${f.a.toFixed(1)}, b = ${f.b.toFixed(2)} (i appen nu: a = ${S.STOCK_MODEL.calib.a}, b = ${S.STOCK_MODEL.calib.b})`); }
  console.log("\nÅr     CNN   appen");
  const by = {}; idx.forEach((i, j) => { const y = rows[i].date.slice(0, 4); (by[y] ||= []).push([off[j], res[j].score]); });
  for (const [y, xs] of Object.entries(by)) console.log(`${y}   ${mean(xs.map((x) => x[0])).toFixed(0).padStart(3)}   ${mean(xs.map((x) => x[1])).toFixed(0).padStart(3)}`);
  return { main, cv: cvs };
}
module.exports = { run };
if (require.main === module) run().catch((e) => { console.error(e.message); process.exit(1); });
