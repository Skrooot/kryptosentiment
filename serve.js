// Liten lokal webbserver för appen: node serve.js, öppna sedan http://localhost:5178
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "www");
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml"
};

// Yahoo Finance tillåter inte anrop från webbläsare (CORS), så aktiefliken går via servern lokalt.
// Bara spark-anropet släpps igenom.
async function yahoo(req, res) {
  const target = "https://query1.finance.yahoo.com" + req.url.slice("/yahoo".length);
  if (!/^\/yahoo\/v7\/finance\/spark\?/.test(req.url)) { res.writeHead(400); res.end(); return; }
  try {
    const r = await fetch(target, { headers: { "User-Agent": "Kryptosentiment/1.4 (+https://github.com/Skrooot/kryptosentiment)" } });
    res.writeHead(r.status, { "Content-Type": "application/json" });
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.writeHead(502); res.end(); }
}

http.createServer((req, res) => {
  if (req.url.startsWith("/yahoo/")) return yahoo(req, res);
  const rel = decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html");
  const file = path.join(root, path.normalize(rel));
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end("Hittades inte"); return; }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
}).listen(5178, () => console.log("Kryptosentiment körs på http://localhost:5178"));
