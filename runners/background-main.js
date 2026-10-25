// Bakgrundskörning för Android-appen (Capacitor Background Runner).
// Körs ungefär en gång i timmen även när appen är stängd. scripts/build-runner.js lägger score.js
// framför den här filen och skriver resultatet till www/runners/background.js.
//
// Varje körning räknar om indexet för alla Avanza-mynt, sparar en timmätning och jämför med förra
// körningens nivåer. Notis skickas när ett mynt går ner i extrem rädsla eller upp i extrem girighet.

const KEY_LEVELS = "ks-levels";
const KEY_STATUS = "ks-bg-status";
const KEY_NOTIFY = "ks-notify";
const KEY_NOTIFIED = "ks-notified";
const KEY_HISTORY = "ks-bg-history";
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
      autoCancel: true,
      smallIcon: SMALL_ICON
    });
    return notices;
  }
  fear.forEach((c) => notices.push({
    id: id++,
    title: `${c.name} är i extrem rädsla`,
    body: `Indexet har fallit till ${c.score} av 100. ${AVANZA[c.id][0]} finns som certifikat på Avanza.`,
    autoCancel: true,
    smallIcon: SMALL_ICON
  }));
  greed.forEach((c) => notices.push({
    id: id++,
    title: `${c.name} är i extrem girighet`,
    body: `Indexet har stigit till ${c.score} av 100. ${AVANZA[c.id][0]} finns som certifikat på Avanza.`,
    autoCancel: true,
    smallIcon: SMALL_ICON
  }));
  return notices;
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

// args.silent = true används när appen själv startar en kontroll: nivåerna sparas men ingen notis skickas.
addEventListener("checkSentiment", async (resolve, reject, args) => {
  try {
    const res = await fetch(MARKETS_URL());
    if (!res.ok) throw new Error(`CoinGecko svarade ${res.status}`);
    const coins = computeScores(await res.json());
    if (!coins.length) throw new Error("Inga mynt i svaret");
    const now = Date.now();

    const prev = readJson(KEY_LEVELS);
    const levels = {};
    coins.forEach((c) => { levels[c.id] = c.cls; });

    const silent = !!(args && args.silent);
    const notifyOn = readJson(KEY_NOTIFY) !== false;
    const notified = readJson(KEY_NOTIFIED) || {};
    // Nytt extremläge sedan förra körningen, och ingen notis om samma läge de senaste 12 timmarna
    // (annars ger ett mynt som pendlar kring gränsen en notis varje timme).
    const entered = (c, cls) => c.cls === cls && prev[c.id] !== undefined && prev[c.id] !== cls &&
      !(notified[c.id + ":" + cls] > now - QUIET_MS);
    let sent = 0;
    if (prev && notifyOn && !silent) {
      const fear = coins.filter((c) => entered(c, 0));
      const greed = coins.filter((c) => entered(c, 4));
      const notices = buildNotices(fear, greed);
      if (notices.length) {
        CapacitorNotifications.schedule(notices);
        fear.forEach((c) => { notified[c.id + ":0"] = now; });
        greed.forEach((c) => { notified[c.id + ":4"] = now; });
        CapacitorKV.set(KEY_NOTIFIED, JSON.stringify(notified));
      }
      sent = notices.length;
    }

    CapacitorKV.set(KEY_LEVELS, JSON.stringify(levels));
    saveHistory(coins, now);
    const status = {
      at: now,
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

// Appen läser senaste bakgrundskörningen, timhistoriken och slår på eller av notiser.
addEventListener("getStatus", (resolve) => {
  resolve({ status: readJson(KEY_STATUS), notify: readJson(KEY_NOTIFY) !== false });
});

addEventListener("getHistory", (resolve) => {
  resolve({ history: readJson(KEY_HISTORY) || {} });
});

addEventListener("setNotify", (resolve, reject, args) => {
  CapacitorKV.set(KEY_NOTIFY, JSON.stringify(!!(args && args.on)));
  resolve({ notify: !!(args && args.on) });
});
