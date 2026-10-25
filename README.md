# Kryptosentiment

Fear & Greed för kryptomarknaden och ett eget beräknat sentimentindex (0–100) för varje kryptovaluta som går att köpa som certifikat eller ETP på Avanza.

## Ladda ner Android-appen

**[Kryptosentiment.apk](https://github.com/Skrooot/kryptosentiment/raw/main/Kryptosentiment.apk)** (version 1.2)

1. Öppna länken i Chrome på telefonen.
2. Tryck på den nedladdade filen och tillåt installation från den här källan.
3. Välj **Installera** (och **Installera ändå** om Play Protect varnar för okänd utvecklare).
4. Öppna appen och tryck **Slå på notiser**.

Har du redan en äldre version installerar du bara den nya ovanpå. Bevakade mynt finns kvar. Indexhistoriken börjar om i version 1.2, eftersom äldre värden räknades fel när SEK var vald.

## Notiser

Android-appen kontrollerar alla mynt ungefär en gång i timmen, även när appen är stängd. Om ett mynt går ner i **extrem rädsla** (index under 25) eller upp i **extrem girighet** (över 75) skickas en notis. Byter fler än fyra mynt läge samtidigt kommer en samlad notis. Samma mynt ger högst en notis per läge och 12 timmar, så ett mynt som pendlar kring gränsen inte ger en notis varje timme. Timmätningarna från bakgrunden visas också i appens historik.

Indexet räknas alltid på USD-data, så det blir detsamma oavsett om priserna visas i USD, SEK eller EUR.

Android bestämmer exakt när bakgrundskontrollen körs och kan skjuta upp den när batterisparläget är på. Om notiserna uteblir kan du stänga av batterioptimering för appen under Inställningar → Appar → Kryptosentiment → Batteri.

## Projektet

- `www/` – webbappen (`index.html`, `score.js` med indexberäkningen, service worker, manifest och ikoner)
- `runners/background-main.js` – timkontrollen och notiserna; `npm run runner` lägger ihop den med `www/score.js`
- `android/` – Android-projektet (Capacitor)
- `npm test` – testar indexberäkningen och bakgrundskörningen (`npm run test:live` testar även mot riktig CoinGecko-data)
- `npm run serve` – kör webbappen på http://localhost:5178
- `npm run build` – bygger `android/app/build/outputs/apk/debug/app-debug.apk` (kräver JDK 21 och Android SDK)

Data: [CoinGecko](https://www.coingecko.com) och [alternative.me](https://alternative.me/crypto/fear-and-greed-index/). Indexet är ett sentimentmått och inte ett köp- eller säljråd.
