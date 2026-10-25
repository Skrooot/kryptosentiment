// Bakgrundskörning för Android-appen (Capacitor Background Runner).
// Körs ungefär en gång i timmen även när appen är stängd. scripts/build-runner.js lägger score.js
// framför den här filen och skriver resultatet till www/runners/background.js.
//
// Varje körning räknar om indexet för alla Avanza-mynt och jämför med förra körningens nivåer.
// Notis skickas när ett mynt går ner i extrem rädsla eller upp i extrem girighet.

const KEY_LEVELS = "ks-levels";
const KEY_STATUS = "ks-bg-status";
const KEY_NOTIFY = "ks-notify";
const MAX_SINGLE = 4; // fler mynt än så samlas i en sammanfattande notis

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

function buildNotices(fear, greed) {
  let id = Math.floor(Date.now() / 1000) % 100000000;
  const notices = [];
  if (fear.length + greed.length > MAX_SINGLE) {
    const parts = [];
    if (fear.length) parts.push(`Extrem rädsla: ${listNames(fear)}`);
    if (greed.length) parts.push(`Extrem girighet: ${listNames(greed)}`);
    notices.push({
      id: id++,
      title: `${fear.length + greed.length} kryptovalutor har bytt till ett extremläge`,
      body: parts.join(". "),
      largeBody: parts.join("\n\n"),
      autoCancel: true
    });
    return notices;
  }
  fear.forEach((c) => notices.push({
    id: id++,
    title: `${c.name} är i extrem rädsla`,
    body: `Indexet har fallit till ${c.score} av 100. ${c.symbol.toUpperCase()} finns som certifikat på Avanza.`,
    autoCancel: true
  }));
  greed.forEach((c) => notices.push({
    id: id++,
    title: `${c.name} är i extrem girighet`,
    body: `Indexet har stigit till ${c.score} av 100. ${c.symbol.toUpperCase()} finns som certifikat på Avanza.`,
    autoCancel: true
  }));
  return notices;
}

// args.silent = true används när appen själv startar en kontroll: nivåerna sparas men ingen notis skickas.
addEventListener("checkSentiment", async (resolve, reject, args) => {
  try {
    const ids = Object.keys(AVANZA).join(",");
    const res = await fetch(`${CG}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=250&sparkline=true&price_change_percentage=24h,7d,30d`);
    if (!res.ok) throw new Error(`CoinGecko svarade ${res.status}`);
    const coins = computeScores(await res.json());
    if (!coins.length) throw new Error("Inga mynt i svaret");

    const prev = readJson(KEY_LEVELS);
    const levels = {};
    coins.forEach((c) => { levels[c.id] = c.cls; });

    const silent = !!(args && args.silent);
    const notifyOn = readJson(KEY_NOTIFY) !== false;
    let sent = 0;
    if (prev && notifyOn && !silent) {
      const fear = coins.filter((c) => c.cls === 0 && prev[c.id] !== undefined && prev[c.id] !== 0);
      const greed = coins.filter((c) => c.cls === 4 && prev[c.id] !== undefined && prev[c.id] !== 4);
      const notices = buildNotices(fear, greed);
      if (notices.length) CapacitorNotifications.schedule(notices);
      sent = notices.length;
    }

    CapacitorKV.set(KEY_LEVELS, JSON.stringify(levels));
    const status = {
      at: Date.now(),
      coins: coins.length,
      sent,
      extremeFear: coins.filter((c) => c.cls === 0).map((c) => c.name),
      extremeGreed: coins.filter((c) => c.cls === 4).map((c) => c.name)
    };
    CapacitorKV.set(KEY_STATUS, JSON.stringify(status));
    resolve(status);
  } catch (err) {
    CapacitorKV.set(KEY_STATUS, JSON.stringify({ at: Date.now(), error: String(err && err.message || err) }));
    reject(err);
  }
});

// Appen läser senaste bakgrundskörningen och slår på eller av notiser.
addEventListener("getStatus", (resolve) => {
  resolve({ status: readJson(KEY_STATUS), notify: readJson(KEY_NOTIFY) !== false });
});

addEventListener("setNotify", (resolve, reject, args) => {
  CapacitorKV.set(KEY_NOTIFY, JSON.stringify(!!(args && args.on)));
  resolve({ notify: !!(args && args.on) });
});
