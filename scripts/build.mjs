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
  "{{TICKER}}": tickerMarkup,
};

let html = await readFile(path.join(output, "index.html"), "utf8");
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
await writeFile(path.join(output, "index.html"), html);

await mkdir(path.join(output, "data"), { recursive: true });
await writeFile(path.join(output, "data", "site.json"), `${JSON.stringify(site, null, 2)}\n`);
await writeFile(path.join(output, "data", "rangers.json"), `${JSON.stringify(rangers, null, 2)}\n`);

const redirectTemplate = await readFile(path.join(root, "templates", "redirect.html"), "utf8");
for (const mode of ["prev", "next", "random"]) {
  const directory = path.join(output, mode);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "index.html"),
    redirectTemplate
      .replaceAll("{{MODE}}", mode)
      .replaceAll("{{TITLE}}", escapeHtml(`Finding a ${mode} Ranger…`))
      .replaceAll("{{HOME_URL}}", escapeHtml(site.canonical_url)),
  );
}

await writeFile(path.join(output, ".nojekyll"), "");
if (site.cname) await writeFile(path.join(output, "CNAME"), `${site.cname}\n`);

console.log(`✓ Built ${rangers.length} Rangers into dist/`);
