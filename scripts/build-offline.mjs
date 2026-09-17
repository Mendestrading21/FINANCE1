import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const assets = (await readdir("dist/assets")).map((name) => `./assets/${name}`);
const publicFiles = (await readdir("dist"))
  .filter((name) => !["assets", "sw.js"].includes(name))
  .map((name) => `./${name}`);
const files = ["./", ...publicFiles, ...assets];
const version = createHash("sha256")
  .update(await readFile("dist/index.html"))
  .digest("hex")
  .slice(0, 12);
await writeFile(
  "dist/sw.js",
  `const CACHE='finance-shell-${version}';
const FILES=${JSON.stringify(files)};
const URLS=FILES.map(p=>new URL(p,self.location).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('finance-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!URLS.includes(e.request.url))return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request))||fetch(e.request)));});
`,
);
console.log("Offline application shell generated; no private data cached.");
