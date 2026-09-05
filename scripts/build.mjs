import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadContent } from "./lib/content.mjs";

const root = process.cwd();
const output = path.join(root, "dist");
const { site, rangers } = await loadContent(root);

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, "src"), output, { recursive: true });

const versionedSource = await Promise.all(
  [
    "src/assets/app.js",
    "src/assets/redirect.css",
    "src/assets/redirect.js",
    "src/assets/rangerverse-max.webp",
    "src/assets/rangerverse-max-transparent.webp",
    "src/assets/rangerverse-return.png",
    "src/assets/styles.css",
  ].map((file) => readFile(path.join(root, file))),
);
const versionHash = createHash("sha256");
for (const source of versionedSource) versionHash.update(source);
versionHash.update(JSON.stringify(site));
versionHash.update(JSON.stringify(rangers));
const assetVersion = versionHash.digest("hex").slice(0, 12);

const tickerItems = site.ticker.map((item) => item.replaceAll("{count}", String(rangers.length)));
const tickerMarkup = [...tickerItems, ...tickerItems]
  .map((item) => `<span>${escapeHtml(item)}</span>`)
  .join("");
const replacements = {
  "{{TITLE}}": escapeHtml(site.title),
  "{{DESCRIPTION}}": escapeHtml(site.description),
  "{{CANONICAL_URL}}": escapeHtml(site.canonical_url),
  "{{EYEBROW}}": escapeHtml(site.eyebrow),
  "{{FOOTER_NOTE}}": escapeHtml(site.footer_note),
  "{{RANGER_COUNT}}": String(rangers.length),
  "{{ASSET_VERSION}}": assetVersion,
  "{{TICKER}}": tickerMarkup,
};

let html = await readFile(path.join(output, "index.html"), "utf8");
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
await writeFile(path.join(output, "index.html"), html);

await mkdir(path.join(output, "data"), { recursive: true });
await writeFile(path.join(output, "data", "site.json"), `${JSON.stringify(site, null, 2)}\n`);
await writeFile(path.join(output, "data", "rangers.json"), `${JSON.stringify(rangers, null, 2)}\n`);

for (const asset of ["app.js", "redirect.js"]) {
  const assetPath = path.join(output, "assets", asset);
  const source = await readFile(assetPath, "utf8");
  await writeFile(assetPath, source.replaceAll("{{ASSET_VERSION}}", assetVersion));
}

const redirectTemplate = await readFile(path.join(root, "templates", "redirect.html"), "utf8");
for (const mode of ["prev", "next", "random"]) {
  const directory = path.join(output, mode);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "index.html"),
    redirectTemplate
      .replaceAll("{{MODE}}", mode)
      .replaceAll("{{TITLE}}", escapeHtml(`Finding a ${mode} Ranger…`))
      .replaceAll("{{HOME_URL}}", escapeHtml(site.canonical_url))
      .replaceAll("{{ASSET_VERSION}}", assetVersion),
  );
}

await writeFile(path.join(output, ".nojekyll"), "");
if (site.cname) await writeFile(path.join(output, "CNAME"), `${site.cname}\n`);

for (const generatedFile of [
  "index.html",
  "assets/app.js",
  "assets/redirect.js",
  "prev/index.html",
  "next/index.html",
  "random/index.html",
]) {
  const source = await readFile(path.join(output, generatedFile), "utf8");
  if (/\{\{[A-Z_]+\}\}/.test(source)) throw new Error(`${generatedFile} contains an unresolved build token`);
}

console.log(`✓ Built ${rangers.length} Rangers into dist/ (assets ${assetVersion})`);
