// Svenska aktier på Stockholmsbörsen, Large Cap och Mid Cap (Avanzas aktielista 27 okt 2026, 302 aktier).
// [Yahoo-kortnamn, namn, segment L/M, Avanzas orderbok-id]. Sampo A saknas (inget kronpris hos Yahoo).
const STOCKS_DATE = "27 okt 2026";
const STOCKS = [
  ["AAK.ST", "AAK", "L", 26268],
  ["ABB.ST", "ABB", "L", 5447],
  ["ALIF-B.ST", "AddLife B", "L", 643541],
  ["ANOD-B.ST", "Addnode Group B", "L", 5442],
  ["ADDT-B.ST", "Addtech B", "L", 5537],
  ["AFRY.ST", "AFRY", "L", 5301],
  ["ALFA.ST", "Alfa Laval", "L", 5580],
  ["ALIG.ST", "Alimak Group", "L", 572678],
  ["ALLEI.ST", "Alleima", "L", 1455120],
  ["ALTRA.ST", "Altra Fastigheter", "L", 907825],
  ["ALVO-SDB.ST", "Alvotech SDB", "L", 2067841],
  ["AQ.ST", "AQ Group", "L", 5534],
  ["ARION-SDB.ST", "Arion Bank SDB", "L", 861076],
  ["ASKER.ST", "Asker Healthcare", "L", 2006454],
  ["ASMDEE-B.ST", "Asmodee", "L", 1961461],
  ["ASSA-B.ST", "Assa Abloy B", "L", 5271],
  ["AZN.ST", "AstraZeneca", "L", 5431],
  ["ATCO-A.ST", "Atlas Copco A", "L", 5234],
  ["ATCO-B.ST", "Atlas Copco B", "L", 5235],
  ["ATRLJ-B.ST", "Atrium Ljungberg B", "L", 5374],
  ["ALIV-SDB.ST", "Autoliv SDB", "L", 5236],
  ["AZA.ST", "Avanza Bank Holding", "L", 5361],
  ["AXFO.ST", "Axfood", "L", 5465],
  ["BALD-B.ST", "Balder B", "L", 5459],
  ["BEIA-B.ST", "Beijer Alma B", "L", 5303],
  ["BEIJ-B.ST", "Beijer Ref B", "L", 5274],
  ["BETS-B.ST", "Betsson B", "L", 5482],
  ["BILI-A.ST", "Bilia A", "L", 5276],
  ["BILL.ST", "Billerud", "L", 5556],
  ["BIOA-B.ST", "BioArctic B", "L", 791946],
  ["BOL.ST", "Boliden", "L", 5564],
  ["BONEX.ST", "BONESUPPORT", "L", 765299],
  ["BRAV.ST", "Bravida Holding", "L", 602637],
  ["BUFAB.ST", "Bufab", "L", 462932],
  ["BURE.ST", "Bure Equity", "L", 5277],
  ["CAMX.ST", "Camurus", "L", 613452],
  ["CAST.ST", "Castellum", "L", 5353],
  ["CATE.ST", "Catena", "L", 41007],
  ["CLAS-B.ST", "Clas Ohlson B", "L", 5457],
  ["CORE-A.ST", "Corem Property Group A", "L", 181790],
  ["CORE-B.ST", "Corem Property Group B", "L", 811076],
  ["CORE-D.ST", "Corem Property Group D", "L", 1242472],
  ["CORE-PREF.ST", "Corem Property Group Pref", "L", 216649],
  ["DOM.ST", "Dometic Group", "L", 611718],
  ["ELUX-A.ST", "Electrolux A", "L", 5237],
  ["ELUX-B.ST", "Electrolux B", "L", 5238],
  ["EPRO-B.ST", "Electrolux Professional B", "L", 1072320],
  ["EKTA-B.ST", "Elekta B", "L", 5280],
  ["EMBRAC-B.ST", "Embracer Group B", "L", 707695],
  ["ENGCON-B.ST", "engcon B", "L", 1418985],
  ["EPI-A.ST", "Epiroc A", "L", 861430],
  ["EPI-B.ST", "Epiroc B", "L", 861431],
  ["EQT.ST", "EQT", "L", 1001617],
  ["ERIC-A.ST", "Ericsson A", "L", 5239],
  ["ERIC-B.ST", "Ericsson B", "L", 5240],
  ["ESSITY-A.ST", "Essity A", "L", 764223],
  ["ESSITY-B.ST", "Essity B", "L", 764241],
  ["EVO.ST", "Evolution", "L", 549768],
  ["FABG.ST", "Fabege", "L", 5300],
  ["FPAR-A.ST", "Fastpartner A", "L", 5357],
  ["FPAR-D.ST", "Fastpartner D", "L", 1025156],
  ["FOI-B.ST", "Fenix Outdoor B", "L", 488741],
  ["GETI-B.ST", "Getinge B", "L", 5282],
  ["GRNG.ST", "Gränges", "L", 510194],
  ["HM-B.ST", "H&M B", "L", 5364],
  ["HACK.ST", "Hacksaw", "L", 2094659],
  ["SHB-A.ST", "Handelsbanken A", "L", 5264],
  ["SHB-B.ST", "Handelsbanken B", "L", 5265],
  ["HEM.ST", "Hemnet Group", "L", 1220100],
  ["HEXA-B.ST", "Hexagon B", "L", 5286],
  ["HPOL-B.ST", "Hexpol B", "L", 130828],
  ["HMS.ST", "HMS Networks", "L", 98412],
  ["HOLM-A.ST", "Holmen A", "L", 5250],
  ["HOLM-B.ST", "Holmen B", "L", 5251],
  ["HUFV-A.ST", "Hufvudstaden A", "L", 5287],
  ["HUSQ-A.ST", "Husqvarna A", "L", 45188],
  ["HUSQ-B.ST", "Husqvarna B", "L", 45189],
  ["INDU-A.ST", "Industrivärden A", "L", 5244],
  ["INDU-C.ST", "Industrivärden C", "L", 5245],
  ["INDT.ST", "Indutrade", "L", 26607],
  ["IPCO.ST", "International Petroleum Corp.", "L", 746877],
  ["INVE-A.ST", "Investor A", "L", 5246],
  ["INVE-B.ST", "Investor B", "L", 5247],
  ["IVSO.ST", "INVISIO", "L", 43788],
  ["JM.ST", "JM", "L", 5501],
  ["KINV-A.ST", "Kinnevik A", "L", 5368],
  ["KINV-B.ST", "Kinnevik B", "L", 5369],
  ["LAGR-B.ST", "Lagercrantz Group B", "L", 5536],
  ["LATO-B.ST", "Latour B", "L", 5321],
  ["LIFCO-B.ST", "Lifco B", "L", 520898],
  ["LIAB.ST", "Lindab International", "L", 59810],
  ["LOOMIS.ST", "Loomis", "L", 154930],
  ["LUND-B.ST", "Lundberg B", "L", 5375],
  ["LUG.ST", "Lundin Gold", "L", 528238],
  ["LUMI.ST", "Lundin Mining Corporation", "L", 7010],
  ["MCOV-B.ST", "Medicover B", "L", 756355],
  ["MIPS.ST", "Mips", "L", 740416],
  ["MTRS.ST", "Munters Group", "L", 755803],
  ["MYCR.ST", "Mycronic", "L", 5466],
  ["NCC-A.ST", "NCC A", "L", 5293],
  ["NCC-B.ST", "NCC B", "L", 5294],
  ["NEWA-B.ST", "New Wave B", "L", 5324],
  ["NIBE-B.ST", "Nibe Industrier B", "L", 5325],
  ["NOBA.ST", "NOBA Bank", "L", 2172399],
  ["NOLA-B.ST", "Nolato B", "L", 5327],
  ["NDA-SE.ST", "Nordea", "L", 5249],
  ["SAVE.ST", "Nordnet", "L", 1162349],
  ["NP3.ST", "NP3 Fastigheter", "L", 522855],
  ["NP3-PREF.ST", "NP3 Fastigheter Pref", "L", 832753],
  ["OCTV-SDB.ST", "Octave Intelligence SDB", "L", 2479521],
  ["OEM-B.ST", "OEM International B", "L", 5329],
  ["PNDX-B.ST", "Pandox B", "L", 572898],
  ["PDX.ST", "Paradox Interactive", "L", 661786],
  ["PEAB-B.ST", "Peab B", "L", 5330],
  ["PUBLI.ST", "PPI Public Property Invest", "L", 2473106],
  ["ROKO-B.ST", "Röko B", "L", 1993897],
  ["SAAB-B.ST", "SAAB B", "L", 5401],
  ["SAGA-A.ST", "Sagax A", "L", 96768],
  ["SAGA-B.ST", "Sagax B", "L", 405815],
  ["SAGA-D.ST", "Sagax D", "L", 703653],
  ["SAND.ST", "Sandvik", "L", 5471],
  ["SCA-A.ST", "SCA A", "L", 5262],
  ["SCA-B.ST", "SCA B", "L", 5263],
  ["SHOT.ST", "Scandic Hotels Group", "L", 613140],
  ["SEB-A.ST", "SEB A", "L", 5255],
  ["SEB-C.ST", "SEB C", "L", 5256],
  ["SECT-B.ST", "Sectra B", "L", 5426],
  ["SECU-B.ST", "Securitas B", "L", 5270],
  ["SINCH.ST", "Sinch", "L", 599956],
  ["SKA-B.ST", "Skanska B", "L", 5257],
  ["SKF-A.ST", "SKF A", "L", 5258],
  ["SKF-B.ST", "SKF B", "L", 5259],
  ["SKIS-B.ST", "SkiStar B", "L", 5339],
  ["SSAB-A.ST", "SSAB A", "L", 5260],
  ["SSAB-B.ST", "SSAB B", "L", 5261],
  ["STE-A.ST", "Stora Enso A", "L", 5421],
  ["STE-R.ST", "Stora Enso R", "L", 5422],
  ["STOR-B.ST", "Storskogen B", "L", 1284767],
  ["SWEC-A.ST", "Sweco A", "L", 5408],
  ["SWEC-B.ST", "Sweco B", "L", 5409],
  ["SWED-A.ST", "Swedbank A", "L", 5241],
  ["SOBI.ST", "Swedish Orphan Biovitrum", "L", 51308],
  ["SYSR.ST", "Systemair", "L", 97407],
  ["TEL2-A.ST", "Tele2 A", "L", 5385],
  ["TEL2-B.ST", "Tele2 B", "L", 5386],
  ["TELIA.ST", "Telia Company", "L", 5479],
  ["THULE.ST", "Thule Group", "L", 521491],
  ["TIETOS.ST", "Tieto", "L", 5455],
  ["8TRA.ST", "TRATON SE", "L", 972553],
  ["TREL-B.ST", "Trelleborg B", "L", 5267],
  ["TROAX.ST", "Troax Group", "L", 551073],
  ["TRUE-B.ST", "Truecaller", "L", 1286052],
  ["VSURE.ST", "Verisure", "L", 2185531],
  ["VIMIAN.ST", "Vimian Group", "L", 1242474],
  ["VIT-B.ST", "Vitec Software Group B", "L", 5526],
  ["VITR.ST", "Vitrolife", "L", 5508],
  ["VOLV-A.ST", "Volvo A", "L", 5268],
  ["VOLV-B.ST", "Volvo B", "L", 5269],
  ["VOLCAR-B.ST", "Volvo Car B", "L", 1296604],
  ["WALL-B.ST", "Wallenstam B", "L", 5344],
  ["WIHL.ST", "Wihlborgs Fastigheter", "L", 18813],
  ["YUBICO.ST", "Yubico", "L", 1206860],
  ["ACAD.ST", "AcadeMedia", "M", 667476],
  ["ACAST.ST", "Acast", "M", 1242014],
  ["ALLIGO-B.ST", "Alligo B", "M", 765297],
  ["AMBEA.ST", "Ambea", "M", 741458],
  ["APOTEA.ST", "Apotea", "M", 1908460],
  ["ARP.ST", "Arctic Paper", "M", 388806],
  ["ARJO-B.ST", "Arjo", "M", 810953],
  ["ATT.ST", "Attendo", "M", 612517],
  ["AVARDA.ST", "Avarda Bank", "M", 666685],
  ["BERG-B.ST", "Bergman & Beving B", "M", 5275],
  ["BESQAB.ST", "Besqab", "M", 1241650],
  ["BESQAB-PREF-B.ST", "Besqab Pref B", "M", 1173927],
  ["BETCO.ST", "Better Collective", "M", 856638],
  ["BHG.ST", "BHG Group", "M", 838544],
  ["BICO.ST", "BICO Group", "M", 702377],
  ["BIOG-B.ST", "BioGaia B", "M", 5349],
  ["BINV.ST", "BioInvent International", "M", 5505],
  ["BONAV-A.ST", "Bonava A", "M", 663401],
  ["BONAV-B.ST", "Bonava B", "M", 663399],
  ["BOOZT.ST", "Boozt", "M", 757760],
  ["BRIN-B.ST", "Brinova Fastigheter B", "M", 694166],
  ["BTS-B.ST", "BTS Group B", "M", 5503],
  ["BMAX.ST", "Byggmax Group", "M", 233288],
  ["AJA-B.ST", "Byggmästare Anders J Ahlström Holding B", "M", 528935],
  ["CAT-A.ST", "Catella A", "M", 159628],
  ["CAT-B.ST", "Catella B", "M", 159629],
  ["CCC.ST", "Cavotec Group", "M", 2107809],
  ["CEVI.ST", "CellaVision", "M", 81967],
  ["CIBUS.ST", "Cibus Real Estate", "M", 831975],
  ["CLA-B.ST", "Cloetta", "M", 163148],
  ["COOR.ST", "Coor Service Management Holding", "M", 572375],
  ["CRED-A.ST", "Creades A", "M", 338588],
  ["CTT.ST", "CTT Systems", "M", 5425],
  ["CYNCA.ST", "Cynca Nordic", "M", 126555],
  ["DIOS.ST", "Diös Fastigheter", "M", 43267],
  ["DUNI.ST", "Duni", "M", 102327],
  ["DUST.ST", "Dustin Group", "M", 538819],
  ["DYVOX.ST", "Dynavox Group", "M", 1314432],
  ["EAST.ST", "Eastnine", "M", 100687],
  ["EGTX.ST", "Egetis Therapeutics", "M", 283294],
  ["ELAN-B.ST", "Elanders B", "M", 5311],
  ["EMIL-B.ST", "Emilshus B", "M", 1411569],
  ["EMIL-PREF.ST", "Emilshus Pref", "M", 1282321],
  ["ENEA.ST", "Enea", "M", 5416],
  ["ENITY.ST", "Enity", "M", 2086531],
  ["EPEN.ST", "Ependion", "M", 5478],
  ["EWRK.ST", "Ework Group", "M", 127201],
  ["FAG.ST", "Fagerhult Group", "M", 5314],
  ["FG.ST", "Fasadgruppen", "M", 1165693],
  ["FLAT-B.ST", "Flat Capital", "M", 1292424],
  ["FLERIE.ST", "Flerie", "M", 695721],
  ["FMM-B.ST", "FM Mattsson B", "M", 743016],
  ["GPG.ST", "Genova Property Group", "M", 1109972],
  ["G2M.ST", "Gentoo Media", "M", 944557],
  ["GREEN.ST", "Green Landscaping Group", "M", 837354],
  ["HNSA.ST", "Hansa Biopharma", "M", 98087],
  ["HANZA.ST", "HANZA", "M", 488235],
  ["HEBA-B.ST", "Heba B", "M", 5363],
  ["HTRO.ST", "Hexatronic Group", "M", 299737],
  ["HOFI.ST", "Hoist Finance", "M", 550518],
  ["HUM.ST", "Humana", "M", 644519],
  ["HUMBLE.ST", "Humble Group", "M", 517315],
  ["INSTAL.ST", "Instalco", "M", 752039],
  ["INTEA-B.ST", "Intea Fastigheter B", "M", 1918578],
  ["INTEA-D.ST", "Intea Fastigheter D", "M", 1918677],
  ["INTRUM.ST", "Intrum", "M", 5583],
  ["INWI.ST", "Inwido", "M", 507540],
  ["ITAB.ST", "ITAB Group", "M", 134988],
  ["JOMA.ST", "John Mattson", "M", 965358],
  ["KFAST-B.ST", "K-Fast Holding B", "M", 1022591],
  ["KABE-B.ST", "KABE Group B", "M", 5319],
  ["KARNEL-B.ST", "Karnell", "M", 1739455],
  ["KAR.ST", "Karnov Group", "M", 949326],
  ["KNOW.ST", "Knowit", "M", 5428],
  ["LIME.ST", "Lime Technologies", "M", 910303],
  ["LINC.ST", "Linc", "M", 1233195],
  ["LMGAB.ST", "Linjemontage i Grästorp", "M", 2644714],
  ["LOGI-B.ST", "Logistea B", "M", 1306448],
  ["MCAP.ST", "MedCap", "M", 46487],
  ["MEKO.ST", "MEKO", "M", 5474],
  ["MER.ST", "Meren Energy", "M", 250993],
  ["MILDEF.ST", "MilDef Group", "M", 1235164],
  ["MMGR-B.ST", "Momentum Group B", "M", 1374804],
  ["MORROW.ST", "Morrow Bank", "M", 2274890],
  ["MTG-A.ST", "MTG A", "M", 5437],
  ["MTG-B.ST", "MTG B", "M", 5438],
  ["NCAB.ST", "NCAB Group", "M", 856458],
  ["NMAN.ST", "Nederman Holding", "M", 80187],
  ["NELLY.ST", "Nelly Group", "M", 262988],
  ["NEOBO.ST", "Neobo Fastigheter", "M", 117108],
  ["NETI-B.ST", "Net Insight B", "M", 5440],
  ["NIVI-B.ST", "Nivika", "M", 1311324],
  ["NOBI.ST", "Nobia", "M", 5586],
  ["NORION.ST", "Norion Bank", "M", 1447081],
  ["NOTE.ST", "Note", "M", 6331],
  ["ORRON.ST", "Orrön Energy", "M", 5698],
  ["OVZON.ST", "Ovzon", "M", 852674],
  ["PLAZ-B.ST", "Platzer Fastigheter Holding B", "M", 445784],
  ["PCELL.ST", "PowerCell Sweden", "M", 527998],
  ["PRISMA.ST", "Prisma Properties", "M", 1798921],
  ["PACT.ST", "Proact IT Group", "M", 5453],
  ["RATO-A.ST", "Ratos A", "M", 5396],
  ["RATO-B.ST", "Ratos B", "M", 5397],
  ["RAY-B.ST", "RaySearch Laboratories B", "M", 5410],
  ["REJL-B.ST", "Rejlers B", "M", 62367],
  ["RUSTA.ST", "Rusta", "M", 1655314],
  ["RVRC.ST", "RVRC Holding", "M", 1241651],
  ["SALIX.ST", "Salix Group", "M", 2510303],
  ["SBB-B.ST", "SBB Norden B", "M", 517316],
  ["SBB-D.ST", "SBB Norden D", "M", 913957],
  ["SCST.ST", "Scandi Standard", "M", 488892],
  ["SDIP-B.ST", "Sdiptech B", "M", 752256],
  ["SILEX.ST", "Silex Microsystems", "M", 2453258],
  ["SMCRT.ST", "SmartCraft Group", "M", 2378377],
  ["STEF-B.ST", "Stendörren Fastigheter B", "M", 273449],
  ["SFAST.ST", "Stenhus Fastigheter i Norden", "M", 1162078],
  ["SF.ST", "Stillfront Group", "M", 614237],
  ["NTECH.ST", "Stockholm Nordtech Group", "M", 2499617],
  ["STORY-B.ST", "Storytel B", "M", 32576],
  ["SVEAF-B.ST", "Sveafastigheter", "M", 1869788],
  ["SVED-B.ST", "Svedbergs Group B", "M", 5335],
  ["SVOL-A.ST", "Svolder A", "M", 5336],
  ["SVOL-B.ST", "Svolder B", "M", 5337],
  ["SLP-B.ST", "Swedish Logistic Property B", "M", 1370669],
  ["SYNSAM.ST", "Synsam", "M", 1296601],
  ["TRAC-B.ST", "Traction B", "M", 5472],
  ["TRIAN-B.ST", "Trianon B", "M", 765298],
  ["TANGEN-B.ST", "Tången Industrikapital", "M", 2502364],
  ["VBG-B.ST", "VBG Group B", "M", 5342],
  ["VEFAB.ST", "VEF", "M", 579702],
  ["VPLAY-A.ST", "Viaplay Group A", "M", 945461],
  ["VPLAY-B.ST", "Viaplay Group B", "M", 945460],
  ["VICO.ST", "Vicore Pharma Holding", "M", 614837],
  ["VISC.ST", "Viscaria", "M", 68827],
  ["VNV.ST", "VNV Global", "M", 87027],
  ["VOLO.ST", "Volati", "M", 709195],
  ["VOLO-PREF.ST", "Volati Pref", "M", 568098],
  ["XANO-B.ST", "XANO Industri B", "M", 5415],
  ["XVIVO.ST", "Xvivo Perfusion", "M", 376275],
  ["ORES.ST", "Öresund", "M", 5302]
];

/* ---------- Indexberäkning per aktie (aktiemodell 1) ----------
   Samma uppbyggnad som kryptomodellen men på dagliga stängningskurser (börsdagar) och kalibrerad mot
   CNN:s Fear & Greed för amerikanska aktier, med S&P 500 (SPY) jul 2011 – sep 2020 som underlag.
   Blockvis korsvalidering på 2 314 börsdagar: korrelation 0,83, medelavvikelse 9,8, samma eller intilliggande nivå 94 %. Kör om scripts/backtest-stocks.js efter ändringar. */
const STOCK_MODEL = {
  version: 1,
  days: 60, // börsdagar som jämförs med (ungefär tre månader)
  weights: { long: 0.3, range: 0.2, mid: 0.3, short: 0.2 },
  k: { long: 1, mid: 1, short: 0.5 },
  calib: { a: -13.5, b: 1.05 }
};
const STOCK_MIN_CLOSES = STOCK_MODEL.days + 31; // 60 dagars jämförelse + 30 dagar för RSI och momentum

function stockSdev(r) { const m = r.reduce((a, b) => a + b, 0) / r.length; return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1)); }
function stockRsi(s, period = 14) {
  let g = 0, l = 0;
  for (let i = 1; i <= period; i++) { const x = s[i] - s[i - 1]; x >= 0 ? g += x : l -= x; }
  g /= period; l /= period;
  for (let i = period + 1; i < s.length; i++) { const x = s[i] - s[i - 1]; g = (g * (period - 1) + Math.max(x, 0)) / period; l = (l * (period - 1) + Math.max(-x, 0)) / period; }
  return l === 0 ? (g === 0 ? 50 : 100) : 100 - 100 / (1 + g / l);
}
// C: stängningskurser äldst först. Index för dag i (kräver i >= STOCK_MIN_CLOSES - 1).
function stockScoreAt(C, i) {
  const N = STOCK_MODEL.days, w = STOCK_MODEL.weights, k = STOCK_MODEL.k, sg = (x) => 1 / (1 + Math.exp(-x));
  const daily = C.slice(i - N, i), p = C[i];
  const r = daily.slice(1).map((x, j) => Math.log(x / daily[j])), sigD = Math.max(stockSdev(r), 0.002);
  const ma = daily.reduce((a, b) => a + b, 0) / daily.length, hi = Math.max(...daily, p), lo = Math.min(...daily, p);
  const f = {
    zLong: Math.log(p / ma) / (sigD * Math.sqrt(21)),
    pos: hi > lo ? (p - lo) / (hi - lo) : 0.5,
    zMid: Math.log(p / C[i - 21]) / (sigD * Math.sqrt(21)),
    zShort: Math.log(p / C[i - 5]) / (sigD * Math.sqrt(5)),
    rsi: stockRsi(C.slice(i - 30, i + 1))
  };
  const v = { long: 100 * sg(k.long * f.zLong), range: 100 * f.pos, mid: 100 * sg(k.mid * f.zMid), short: 50 * sg(k.short * f.zShort) + 0.5 * f.rsi };
  const raw = w.long * v.long + w.range * v.range + w.mid * v.mid + w.short * v.short;
  const score = Math.round(Math.max(0, Math.min(100, STOCK_MODEL.calib.a + STOCK_MODEL.calib.b * raw)));
  return { score, v, f, raw };
}

// Bygger ett listobjekt för en aktie från Yahoos dagsdata (tider i sekunder, stängningskurser).
function stockItem(def, ts, closes, meta) {
  const pts = [];
  for (let i = 0; i < closes.length; i++) if (Number.isFinite(closes[i]) && closes[i] > 0) pts.push([ts[i] * 1000, closes[i]]);
  if (pts.length < 6) return null; // nynoterade aktier med kort historik visas som preliminära
  const C = pts.map((x) => x[1]), n = C.length, p = C[n - 1];
  const prelim = n < STOCK_MIN_CLOSES;
  const pct = (back) => n > back ? (p / C[n - 1 - back] - 1) * 100 : null;
  const [symbol, name, seg, avanzaId] = def;
  let score = null, parts = [], hist = [];
  if (!prelim) {
    const m = stockScoreAt(C, n - 1);
    score = m.score;
    const w = STOCK_MODEL.weights, fz = (z) => `${z >= 0 ? "+" : "−"}${Math.abs(z).toFixed(1)}`;
    parts = [
      { key: "Trend mot 60-dagarssnittet", w: w.long, v: m.v.long, note: `${fz(m.f.zLong)} månadsvolatiliteter från snittet` },
      { key: "Läge i 60-dagarsintervallet", w: w.range, v: m.v.range, note: `${Math.round(m.f.pos * 100)} % från botten mot toppen` },
      { key: "Momentum 1 månad", w: w.mid, v: m.v.mid, note: `${pct(21).toFixed(1)} %, ${fz(m.f.zMid)} i aktiens egen volatilitet` },
      { key: "Kort sikt (1 vecka och RSI)", w: w.short, v: m.v.short, note: `1 v ${pct(5).toFixed(1)} %, RSI ${m.f.rsi.toFixed(0)}` }
    ];
    for (let i = Math.max(STOCK_MIN_CLOSES - 1, n - 120); i < n; i++) hist.push([pts[i][0], stockScoreAt(C, i).score]);
  }
  return {
    id: symbol, kind: "stock", name, symbol: symbol.replace(/\.ST$/, "").replace(/-/g, " "), seg, avanzaId,
    rank: seg === "L" ? 1 : 2, image: "", price: (meta && meta.regularMarketPrice) || p, currency: (meta && meta.currency) || "SEK",
    ch24: pct(1), ch7: pct(5), ch30: pct(21), spark: C.slice(-60),
    score, cls: score == null ? null : classIdx(score), prelim, parts, hist, updatedAt: pts[n - 1][0]
  };
}

// Hämtar alla aktier från Yahoo i grupper om 20 (ett års dagsdata). base = Yahoo-adressen eller en lokal proxy.
// Yahoo avvisar en hel grupp om ett kortnamn inte finns; då frågas de ett och ett.
const STOCK_UA = "Kryptosentiment/1.4 (+https://github.com/Skrooot/kryptosentiment)";
async function fetchStocks(base, opts = {}) {
  const defs = [["^OMX", "Stockholmsbörsen (OMXS30)", "I", 0], ...STOCKS];
  const headers = opts.headers || {};
  const items = [], failed = [];
  const get = async (syms) => {
    // method måste anges: bakgrundsmotorns fetch avvisar annars anrop med rubriker
    const r = await fetch(`${base}/v7/finance/spark?symbols=${syms.map(encodeURIComponent).join(",")}&range=1y&interval=1d`, { method: "GET", headers });
    if (r.status === 404 && syms.length > 1) { const out = {}; for (const s of syms) Object.assign(out, await get([s]).catch(() => ({}))); return out; }
    if (!r.ok) throw new Error(`Yahoo svarade ${r.status}`);
    const out = {};
    ((await r.json()).spark || {}).result.forEach((x) => { const q = x.response && x.response[0]; if (q && q.timestamp) out[x.symbol] = q; });
    return out;
  };
  for (let i = 0; i < defs.length; i += 20) {
    const batch = defs.slice(i, i + 20);
    // Vid spärr (429) eller tillfälligt fel: två nya försök med väntan innan gruppen ges upp
    let res = null;
    for (let attempt = 0; attempt < 3 && !res; attempt++) {
      try { res = await get(batch.map((d) => d[0])); }
      catch (e) {
        if (attempt === 2) { if (i === 0) throw e; batch.forEach((d) => failed.push(d[0])); }
        else await new Promise((res2) => setTimeout(res2, (opts.retryWait ?? 8000) * (attempt + 1)));
      }
    }
    if (!res) continue;
    batch.forEach((d) => {
      const q = res[d[0]];
      const it = q && stockItem(d, q.timestamp, (q.indicators.quote[0] || {}).close || [], q.meta);
      if (it) items.push(it); else failed.push(d[0]);
    });
    if (opts.onProgress) opts.onProgress(items.length, defs.length);
    if (i + 20 < defs.length) await new Promise((res2) => setTimeout(res2, opts.pause ?? 600));
  }
  return { index: items.find((x) => x.id === "^OMX") || null, items: items.filter((x) => x.id !== "^OMX"), failed };
}

// Svensk tid räknad ur UTC (CET/CEST enligt EU:s regler: sommartid från sista söndagen i mars 01:00 UTC till
// sista söndagen i oktober 01:00 UTC). Oberoende av telefonens tidszon och av bakgrundsmotorns lokala tid.
function stockholmTime(d = new Date()) {
  const y = d.getUTCFullYear();
  const lastSunday = (m) => { const t = new Date(Date.UTC(y, m + 1, 0, 1)); t.setUTCDate(t.getUTCDate() - t.getUTCDay()); return t.getTime(); };
  const summer = d.getTime() >= lastSunday(2) && d.getTime() < lastSunday(9);
  const t = new Date(d.getTime() + (summer ? 2 : 1) * 3600e3);
  return { day: t.getUTCDay(), hour: t.getUTCHours() + t.getUTCMinutes() / 60 };
}
// Börsen är öppen 09:00–17:30 svensk tid på vardagar (helgdagar räknas som vanliga vardagar).
function stockMarketOpen(d = new Date(), until = 17.5) { const t = stockholmTime(d); return t.day > 0 && t.day < 6 && t.hour >= 9 && t.hour <= until; }
