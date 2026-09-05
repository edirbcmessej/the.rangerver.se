import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const root = path.resolve(process.argv[2] || "dist");
const port = Number(process.env.PORT || 4173);
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

async function resolveFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = path.resolve(root, `.${decoded}`);
  if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) return path.join(candidate, "index.html");
    return candidate;
  } catch {
    const htmlCandidate = path.join(candidate, "index.html");
    try {
      await access(htmlCandidate);
      return htmlCandidate;
    } catch {
      return null;
    }
  }
}

createServer(async (request, response) => {
  const file = await resolveFile(request.url || "/");
  if (!file) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  console.log(`Rangerverse is orbiting at http://127.0.0.1:${port}`);
});
