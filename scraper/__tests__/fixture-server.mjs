// scraper/__tests__/fixture-server.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, "..", "fixtures");

const routes = {
  "/": () => ({ status: 200, body: read("homepage.html"), type: "text/html" }),
  "/products.json": () => ({ status: 200, body: read("products.json"), type: "application/json" }),
  "/products/dog-bed": () => ({ status: 200, body: read("jsonld-product.html"), type: "text/html" }),
  "/products/dog-food": () => ({ status: 200, body: read("heuristic-product.html"), type: "text/html" }),
  "/products/cat-litter": () => ({ status: 200, body: read("heuristic-badge-only.html"), type: "text/html" }),
  "/parked": () => ({ status: 200, body: read("parked-domain.html"), type: "text/html" }),
  "/broken": () => ({ status: 500, body: "error", type: "text/plain" }),
  "/tiny": () => ({ status: 200, body: "hi", type: "text/html" }),
  "/images/photo.jpg": () => ({ status: 200, body: Buffer.from([0xff, 0xd8, 0xff]), type: "image/jpeg" }),
};

function read(file) {
  return fs.readFileSync(path.join(fixturesDir, file), "utf-8");
}

export function startFixtureServer(port = 8931) {
  const server = http.createServer((req, res) => {
    const handler = routes[req.url.split("?")[0]];
    if (!handler) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const { status, body, type } = handler();
    res.writeHead(status, { "Content-Type": type });
    res.end(body);
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}
