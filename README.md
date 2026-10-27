# Kryptosentiment

Fear & Greed för kryptomarknaden och ett eget beräknat sentimentindex (0–100) för varje kryptovaluta som går att köpa som certifikat eller ETP på Avanza, och för varje aktie på Large Cap och Mid Cap Stockholm.

## Ladda ner Android-appen

**[Kryptosentiment.apk](https://github.com/Skrooot/kryptosentiment/raw/main/Kryptosentiment.apk)** (version 1.4)

1. Öppna länken i Chrome på telefonen.
2. Tryck på den nedladdade filen och tillåt installation från den här källan.
3. Välj **Installera** (och **Installera ändå** om Play Protect varnar för okänd utvecklare).
4. Öppna appen och tryck **Slå på notiser**.

Har du redan en äldre version installerar du bara den nya ovanpå. Bevakade mynt och inställningar finns kvar.

## Krypto

Modellen (`www/score.js`) är kalibrerad mot alternative.me:s officiella Fear & Greed för Bitcoin:

| Del | Vikt |
|---|---|
| Trend mot 90-dagarssnittet | 70 % |
| Läge i 90-dagarsintervallet | 10 % |
| Momentum 30 dagar | 10 % |
| Kort sikt (7 d och RSI) | 10 % |

Alla rörelser mäts i myntets egen dagsvolatilitet, så samma formel fungerar för både lugna och svängiga mynt. Summan skalas om (`a + b · summa`) till det officiella indexets skala.

Mot det officiella indexet för Bitcoin, 252 dagar (feb–okt 2026), på dagar som inte användes för kalibreringen (blockvis korsvalidering): korrelation 0,84, medelavvikelse 10 poäng, samma nivå 52 %, samma eller intilliggande nivå 97 %. För andra mynt finns inget officiellt facit. Indexet bygger bara på pris, medan det officiella även väger in sociala medier, sökningar och enkäter.

Varje mynts 90-dagarshistorik hämtas en gång per dygn. Tills den finns visas ett preliminärt värde med ≈, som aldrig ger notiser.

## Aktier

Fliken **Aktier** visar 302 aktier på Large Cap och Mid Cap Stockholm (Avanzas aktielista 27 okt 2026; Sampo A saknas eftersom den inte har kronpris hos Yahoo). Överst visas OMXS30 med samma modell. Varje aktie länkar till sin sida hos Avanza.

Aktiemodellen (`www/stocks.js`) har samma uppbyggnad men räknas på dagliga stängningskurser och är kalibrerad mot CNN:s Fear & Greed för amerikanska aktier:

| Del | Vikt |
|---|---|
| Trend mot 60-dagarssnittet | 30 % |
| Läge i 60-dagarsintervallet | 20 % |
| Momentum 1 månad | 30 % |
| Kort sikt (1 vecka och RSI) | 20 % |

Mot CNN:s index för S&P 500 under 2 314 börsdagar (jul 2011–sep 2020, öppet dataset från [hackingthemarkets/sentiment-fear-and-greed](https://github.com/hackingthemarkets/sentiment-fear-and-greed)), blockvis korsvaliderat: korrelation 0,83, medelavvikelse 9,8, samma eller intilliggande nivå 94 %. Kalibreringen gäller ett brett index; enskilda svenska aktier saknar facit. CNN väger också in optioner, VIX och räntor, vilket modellen inte gör.

Kurserna kommer från Yahoo Finance. Yahoo tillåter inte anrop direkt från webbläsare, så aktiefliken fungerar i Android-appen men inte i webbversionen (lokalt går den via `serve.js`).

## Notiser

Android-appen kontrollerar ungefär en gång i timmen, även när appen är stängd: alla mynt dygnet runt och alla aktier vardagar 09–19 svensk tid. Om ett mynt eller en aktie går ner i **extrem rädsla** (index under 25) eller upp i **extrem girighet** (över 75) skickas en notis. Byter fler än fyra samtidigt kommer en samlad notis. Samma objekt ger högst en notis per läge och 12 timmar. Notiser för krypto och aktier kan slås på och av var för sig.

Indexet för krypto räknas alltid på USD-data, så det blir detsamma oavsett om priserna visas i USD, SEK eller EUR.

Android bestämmer exakt när bakgrundskontrollen körs och kan skjuta upp den när batterisparläget är på. Om notiserna uteblir kan du stänga av batterioptimering för appen under Inställningar → Appar → Kryptosentiment → Batteri.

## Projektet

- `www/` – webbappen (`index.html`, `score.js` för krypto, `stocks.js` för aktier, service worker, manifest och ikoner)
- `runners/background-main.js` – timkontrollen och notiserna; `npm run runner` lägger ihop den med `www/score.js` och `www/stocks.js`
- `android/` – Android-projektet (Capacitor)
- `npm test` – testar modellerna, hämtningen och bakgrundskörningen (`npm run test:live` testar även mot riktig data)
- `npm run backtest` – jämför kryptomodellen med alternative.me (`-- --refit` räknar om kalibreringen)
- `npm run backtest:stocks` – jämför aktiemodellen med CNN:s index (`-- --refit` räknar om kalibreringen)
- `npm run serve` – kör webbappen på http://localhost:5178
- `npm run build` – bygger `android/app/build/outputs/apk/debug/app-debug.apk` (kräver JDK 21 och Android SDK)

Data: [CoinGecko](https://www.coingecko.com), [Binance](https://www.binance.com), [alternative.me](https://alternative.me/crypto/fear-and-greed-index/) och [Yahoo Finance](https://finance.yahoo.com). Indexet är ett sentimentmått och inte ett köp- eller säljråd.
