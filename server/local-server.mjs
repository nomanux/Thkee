// Local Thkee API for testing on your own computer. No database install needed.
// Saved content goes to server/data/state.json. Uploaded files go to server/data/uploads.
// It runs inside the Vite dev server at /thkee-api (see vite.config.ts), so "npm run dev" starts everything.
// It can also run on its own with "npm run api" at http://localhost:8787.
import { createServer } from "node:http";
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync, renameSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PORT = Number(process.env.THKEE_API_PORT || 8787);
const OWNER_KEY = process.env.THKEE_OWNER_KEY || "thkee-local-owner";
const MAX_UPLOAD_BYTES = 800 * 1024 * 1024;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "data");
const UPLOADS = join(ROOT, "uploads");
const STATE_FILE = join(ROOT, "state.json");
const ALLOWED = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "mov", "m4v", "pdf", "txt", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip"];
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", m4v: "video/mp4", pdf: "application/pdf", txt: "text/plain" };

mkdirSync(UPLOADS, { recursive: true });
const readState = () => (existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {});
const writeState = (state) => {
  writeFileSync(`${STATE_FILE}.tmp`, JSON.stringify(state));
  renameSync(`${STATE_FILE}.tmp`, STATE_FILE);
};

function send(res, code, data) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
}

const isOwner = (req) => req.headers["x-admin-key"] === OWNER_KEY;

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) return reject(new Error("Body too large"));
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveUpload(req, res, path) {
  const file = normalize(join(UPLOADS, decodeURIComponent(path)));
  if (!file.startsWith(UPLOADS) || !existsSync(file) || !statSync(file).isFile()) return send(res, 404, { error: "Not found" });
  const size = statSync(file).size;
  const type = MIME[extname(file).slice(1).toLowerCase()] || "application/octet-stream";
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
  if (range) {
    // Videos need range requests so the player can seek.
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${size}`, "Accept-Ranges": "bytes", "Content-Length": end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": size, "Accept-Ranges": "bytes" });
  createReadStream(file).pipe(res);
}

// publicUrl is the address the browser uses to reach this API, for example "/thkee-api".
export function createHandler(publicUrl) {
  return async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key, X-File-Name");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/uploads/")) return serveUpload(req, res, url.pathname.slice("/uploads/".length));

    if (url.pathname === "/check.php") {
      return send(res, 200, { ok: true, database: "local file", admin: isOwner(req), upload_max_filesize: "800M", post_max_size: "800M" });
    }

    if (url.pathname === "/state.php" && req.method === "GET") return send(res, 200, readState());

    if (url.pathname === "/state.php" && req.method === "POST") {
      if (!isOwner(req)) return send(res, 403, { error: "Only the site owner can save changes." });
      const { items } = JSON.parse((await readBody(req, 64 * 1024 * 1024)) || "{}");
      if (!items || typeof items !== "object") return send(res, 400, { error: 'Send {"items": {...}}' });
      const state = readState();
      let saved = 0;
      for (const [key, value] of Object.entries(items)) {
        if (!/^thkee\.[A-Za-z0-9._-]{1,150}$/.test(key)) continue;
        if (value === null) delete state[key];
        else if (typeof value === "string") state[key] = value;
        else continue;
        saved++;
      }
      writeState(state);
      return send(res, 200, { ok: true, saved });
    }

    if (url.pathname === "/upload.php" && req.method === "POST") {
      if (!isOwner(req)) return send(res, 403, { error: "Only the site owner can save changes." });
      const original = decodeURIComponent(String(req.headers["x-file-name"] || "file"));
      const ext = extname(original).slice(1).toLowerCase();
      if (!ALLOWED.includes(ext)) return send(res, 400, { error: `Files of type .${ext} are not allowed.` });
      if (Number(req.headers["content-length"] || 0) > MAX_UPLOAD_BYTES) return send(res, 413, { error: "File is larger than the upload limit." });
      const now = new Date();
      const sub = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
      mkdirSync(join(UPLOADS, sub), { recursive: true });
      const name = `${randomBytes(8).toString("hex")}.${ext}`;
      await new Promise((resolve, reject) => {
        const out = createWriteStream(join(UPLOADS, sub, name));
        req.pipe(out);
        out.on("finish", resolve);
        out.on("error", reject);
        req.on("error", reject);
      });
      const size = statSync(join(UPLOADS, sub, name)).size;
      console.log(`Saved ${original} (${Math.round(size / 1024)} KB)`);
      return send(res, 200, { url: `${publicUrl}/uploads/${sub}/${name}`, name: original, size });
    }

    send(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    send(res, 500, { error: "Server error" });
  }
  };
}

export const paths = { state: STATE_FILE, uploads: UPLOADS };

// Started directly with "node server/local-server.mjs".
if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  createServer(createHandler(`http://localhost:${PORT}`)).listen(PORT, () => {
    console.log(`Thkee local API running at http://localhost:${PORT}`);
    console.log(`Saved content: ${STATE_FILE}`);
    console.log(`Uploaded files: ${UPLOADS}`);
  });
}
