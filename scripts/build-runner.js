// Bygger bakgrundsfilen för Android: www/score.js + runners/background-main.js -> www/runners/background.js
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const score = fs.readFileSync(path.join(root, "www", "score.js"), "utf8");
const main = fs.readFileSync(path.join(root, "runners", "background-main.js"), "utf8");
const outDir = path.join(root, "www", "runners");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "background.js"), `// Genererad fil, ändra i www/score.js eller runners/background-main.js\n${score}\n${main}`);
console.log("Skrev www/runners/background.js");
