// Tester för indexberäkningen (www/score.js) och bakgrundskörningen (runners/background-main.js).
// Kör: npm test        (lägg till --live för att även testa mot riktig CoinGecko-data)
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const root = path.join(__dirname, "..");
const scoreSrc = fs.readFileSync(path.join(root, "www", "score.js"), "utf8");
const runnerSrc = fs.readFileSync(path.join(root, "runners", "background-main.js"), "utf8");
const S = new Function(`${scoreSrc}; return { CG, MARKETS_URL, AVANZA, CLASSES, clamp, logistic, classIdx, median, rsi, hourlyVol, computeScores };`)();

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); passed++; console.log("  ok   " + name); }
  catch (e) { failed++; console.log("  FEL  " + name + "\n       " + e.message); }
}

// Syntetiskt CoinGecko-svar: 168 timpriser per mynt
function coin(id, opts = {}) {
  const n = opts.n ?? 168, start = opts.start ?? 100, end = opts.end ?? 100;
  const price = Array.from({ length: n }, (_, i) => {
    const base = start + (end - start) * i / (n - 1);
    return base * (1 + (opts.noise ?? 0.004) * Math.sin(i * 1.7));
  });
  return {
    id, name: opts.name ?? id, symbol: opts.symbol ?? id.slice(0, 3), image: "", market_cap_rank: 1,
    current_price: price[n - 1], market_cap: 1e9, total_volume: opts.volume ?? 5e7,
    price_change_percentage_24h_in_currency: opts.ch24 ?? 0,
    price_change_percentage_7d_in_currency: opts.ch7 ?? (end / start - 1) * 100,
    price_change_percentage_30d_in_currency: opts.ch30 ?? 0,
    sparkline_in_7d: { price: opts.price ?? price }
  };
}
const ids = Object.keys(S.AVANZA);
// Bakgrundsmarknad av mynt som testerna själva aldrig ändrar på
const NEUTRAL = ["bitcoin", "ethereum", "ripple", "avalanche-2", "hyperliquid", "chainlink", "litecoin", "binancecoin",
  "polygon-ecosystem-token", "stellar", "uniswap", "algorand", "bittensor", "aptos", "arbitrum", "bitcoin-cash",
  "celestia", "internet-computer", "zcash", "dogecoin"];
const neutralMarket = () => NEUTRAL.map((id) => coin(id));

(async () => {
  console.log("Indexberäkning");
  await test("nivågränser 0–24, 25–44, 45–55, 56–75, 76–100", () => {
    const want = { 0: 0, 24: 0, 25: 1, 44: 1, 45: 2, 55: 2, 56: 3, 75: 3, 76: 4, 100: 4 };
    for (const [v, c] of Object.entries(want)) assert.strictEqual(S.classIdx(+v), c, `värde ${v}`);
  });
  await test("RSI: bara uppgång 100, bara nedgång 0, platt 50", () => {
    const up = Array.from({ length: 40 }, (_, i) => 100 + i);
    assert.strictEqual(S.rsi(up), 100);
    assert.ok(S.rsi(up.slice().reverse()) < 0.001);
    assert.strictEqual(S.rsi(Array(40).fill(5)), 50);
    assert.strictEqual(S.rsi([1, 2, 3]), 50, "för kort serie");
  });
  await test("median och volatilitet", () => {
    assert.strictEqual(S.median([3, 1, 2]), 2);
    assert.strictEqual(S.median([4, 1, 3, 2]), 2.5);
    assert.strictEqual(S.median([]), 0);
    assert.strictEqual(S.hourlyVol(Array(50).fill(10)), 0);
    assert.ok(S.hourlyVol([1, 2, 1, 2, 1, 2]) > 0.5);
  });
  await test("stigande mynt får högre index än fallande", () => {
    const raw = [...neutralMarket(), coin("solana", { start: 100, end: 130, ch24: 4, ch7: 30, ch30: 40 }), coin("cardano", { start: 100, end: 70, ch24: -4, ch7: -30, ch30: -40 })];
    const out = S.computeScores(raw);
    const sol = out.find((c) => c.id === "solana"), ada = out.find((c) => c.id === "cardano");
    assert.ok(sol.score >= 76, `solana ${sol.score} borde vara extrem girighet`);
    assert.ok(ada.score <= 24, `cardano ${ada.score} borde vara extrem rädsla`);
  });
  await test("alla index är heltal 0–100 och vikterna summerar till 1", () => {
    const out = S.computeScores([...neutralMarket(), coin("starknet", { start: 1, end: 0.2, ch24: -50, ch7: -80, ch30: -90, volume: 9e9 })]);
    out.forEach((c) => {
      assert.ok(Number.isInteger(c.score) && c.score >= 0 && c.score <= 100, `${c.id}: ${c.score}`);
      assert.ok(Math.abs(c.parts.reduce((a, p) => a + p.w, 0) - 1) < 1e-9);
      c.parts.forEach((p) => assert.ok(p.v >= 0 && p.v <= 100, `${c.id} ${p.key}: ${p.v}`));
    });
  });
  await test("läge i intervallet använder sparklinjen, inte current_price (SEK-buggen)", () => {
    const a = coin("starknet", { start: 1, end: 0.5 });
    const b = { ...coin("starknet", { start: 1, end: 0.5 }), current_price: 999 }; // som om priset vore i SEK
    const ra = S.computeScores([...neutralMarket(), a]).find((c) => c.id === "starknet");
    const rb = S.computeScores([...neutralMarket(), b]).find((c) => c.id === "starknet");
    assert.strictEqual(ra.score, rb.score);
    assert.ok(ra.parts.find((p) => p.key.startsWith("Läge")).v < 20);
  });
  await test("null-värden i sparklinjen hoppas över", () => {
    const p = coin("polkadot").sparkline_in_7d.price; p[50] = null; p[100] = NaN;
    const out = S.computeScores([...neutralMarket(), coin("polkadot", { price: p })]);
    const dot = out.find((c) => c.id === "polkadot");
    assert.ok(dot && Number.isFinite(dot.score));
  });
  await test("mynt utan Avanza-certifikat och för korta serier filtreras bort", () => {
    const out = S.computeScores([...neutralMarket(), coin("not-on-avanza"), coin("tron", { n: 10 })]);
    assert.ok(!out.some((c) => c.id === "not-on-avanza"));
    assert.ok(!out.some((c) => c.id === "tron"));
  });
  await test("saknad 30-dagarsförändring kraschar inte", () => {
    const c = coin("sui"); c.price_change_percentage_30d_in_currency = null;
    const out = S.computeScores([...neutralMarket(), c]).find((x) => x.id === "sui");
    assert.ok(Number.isFinite(out.score));
    assert.strictEqual(out.ch30, null);
  });

  console.log("Bakgrundskörning");
  function makeRunner(responder) {
    const kv = {}, handlers = {}, sent = [];
    const env = {
      CapacitorKV: { get: (k) => ({ value: kv[k] }), set: (k, v) => { kv[k] = v; }, remove: (k) => { delete kv[k]; } },
      CapacitorNotifications: { schedule: (n) => sent.push(...n) },
      addEventListener: (e, f) => { handlers[e] = f; },
      fetch: async (url) => responder(url)
    };
    new Function(...Object.keys(env), `${scoreSrc}\n${runnerSrc}`)(...Object.values(env));
    const run = (e, a) => new Promise((res, rej) => handlers[e](res, rej, a));
    return { kv, sent, run };
  }
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });
  let market = neutralMarket();
  const r = makeRunner(() => ok(market));

  await test("första körningen sparar utgångsläge utan notis", async () => {
    market = [...neutralMarket(), coin("solana", { start: 100, end: 70, ch24: -5, ch7: -30, ch30: -40 })];
    const s = await r.run("checkSentiment", {});
    assert.strictEqual(s.sent, 0);
    assert.ok(s.extremeFear.includes("solana"));
  });
  await test("mynt som går in i extrem rädsla ger en notis", async () => {
    market = [...neutralMarket(), coin("solana"), coin("cardano")];
    await r.run("checkSentiment", {});
    market = [...neutralMarket(), coin("solana"), coin("cardano", { start: 100, end: 70, ch24: -5, ch7: -30, ch30: -40 })];
    const before = r.sent.length;
    const s = await r.run("checkSentiment", {});
    assert.strictEqual(s.sent, 1);
    assert.match(r.sent[before].title, /cardano är i extrem rädsla/);
  });
  await test("mynt som pendlar kring gränsen ger inte ny notis inom 12 timmar", async () => {
    market = [...neutralMarket(), coin("cardano")];
    await r.run("checkSentiment", {});
    market = [...neutralMarket(), coin("cardano", { start: 100, end: 70, ch24: -5, ch7: -30, ch30: -40 })];
    const s = await r.run("checkSentiment", {});
    assert.strictEqual(s.sent, 0);
  });
  await test("mynt som går in i extrem girighet ger en notis", async () => {
    market = [...neutralMarket(), coin("near")];
    await r.run("checkSentiment", {});
    market = [...neutralMarket(), coin("near", { start: 100, end: 135, ch24: 5, ch7: 35, ch30: 45 })];
    const s = await r.run("checkSentiment", {});
    assert.strictEqual(s.sent, 1);
    assert.match(r.sent[r.sent.length - 1].title, /near är i extrem girighet/);
  });
  await test("fler än fyra mynt samtidigt ger en samlad notis", async () => {
    const many = ["aave", "arweave", "cosmos", "tezos", "iota", "kaspa"];
    market = [...neutralMarket(), ...many.map((id) => coin(id))];
    await r.run("checkSentiment", {});
    market = [...neutralMarket(), ...many.map((id) => coin(id, { start: 100, end: 70, ch24: -5, ch7: -30, ch30: -40 }))];
    const s = await r.run("checkSentiment", {});
    assert.strictEqual(s.sent, 1);
    assert.match(r.sent[r.sent.length - 1].title, /^6 kryptovalutor/);
  });
  await test("tyst körning och avstängda notiser skickar inget", async () => {
    const r2 = makeRunner(() => ok(market));
    market = [...neutralMarket(), coin("sui")];
    await r2.run("checkSentiment", {});
    market = [...neutralMarket(), coin("sui", { start: 100, end: 70, ch24: -5, ch7: -30, ch30: -40 })];
    assert.strictEqual((await r2.run("checkSentiment", { silent: true })).sent, 0);
    const r3 = makeRunner(() => ok(market));
    market = [...neutralMarket(), coin("sui")];
    await r3.run("checkSentiment", {});
    await r3.run("setNotify", { on: false });
    market = [...neutralMarket(), coin("sui", { start: 100, end: 70, ch24: -5, ch7: -30, ch30: -40 })];
    assert.strictEqual((await r3.run("checkSentiment", {})).sent, 0);
    assert.strictEqual((await r3.run("getStatus", {})).notify, false);
  });
  await test("fel från CoinGecko sparas som status och behåller tidigare nivåer", async () => {
    const levelsBefore = r.kv["ks-levels"];
    const rErr = makeRunner(() => ({ ok: false, status: 429 }));
    rErr.kv["ks-levels"] = levelsBefore;
    await assert.rejects(rErr.run("checkSentiment", {}));
    assert.strictEqual(rErr.kv["ks-levels"], levelsBefore);
    assert.match(JSON.parse(rErr.kv["ks-bg-status"]).error, /429/);
  });
  await test("timhistorik sparas och hämtas av appen", async () => {
    const h = (await r.run("getHistory", {})).history;
    assert.ok(h.bitcoin && h.bitcoin.length >= 1);
    assert.ok(h.bitcoin.every(([t, v]) => Number.isFinite(t) && Number.isInteger(v)));
  });

  if (process.argv.includes("--live")) {
    console.log("Riktig data från CoinGecko");
    await test("alla Avanza-mynt finns hos CoinGecko och får ett index", async () => {
      const raw = await (await fetch(S.MARKETS_URL())).json();
      const out = S.computeScores(raw);
      const missing = ids.filter((id) => !out.some((c) => c.id === id));
      assert.deepStrictEqual(missing, []);
      const counts = [0, 0, 0, 0, 0]; out.forEach((c) => counts[c.cls]++);
      console.log(`       ${out.length} mynt, per nivå: ${counts.join(" / ")}`);
    });
    await test("bakgrundskörningen fungerar mot riktig data", async () => {
      const live = makeRunner((url) => fetch(url));
      const s = await live.run("checkSentiment", {});
      assert.strictEqual(s.coins, ids.length);
    });
  }

  console.log(`\n${passed} godkända, ${failed} fel`);
  process.exit(failed ? 1 : 0);
})();
