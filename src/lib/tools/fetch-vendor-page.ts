import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

function publicAddress(ip: string): boolean {
  const value = ip.toLowerCase();
  if (value.includes(":")) return !(value === "::1" || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("fe80") || value.startsWith("::ffff:"));
  const parts = value.split(".").map(Number);
  return !(parts[0] === 0 || parts[0] === 10 || parts[0] === 127 || parts[0] >= 224 ||
    (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) || (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127));
}

async function validateUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.port && !["80", "443"].includes(url.port))) throw new Error("Unsafe vendor URL.");
  if (isIP(url.hostname) || url.hostname === "localhost" || url.hostname.endsWith(".local")) throw new Error("Unsafe vendor host.");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => !publicAddress(address))) throw new Error("Unsafe vendor host.");
  return url;
}

export async function fetchVendorPage(rawUrl: string): Promise<{ url: string; title: string; content: string }> {
  let url = await validateUrl(rawUrl);
  for (let redirect = 0; redirect < 3; redirect++) {
    const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10000), headers: { "User-Agent": "PetSquareDiscovery/1.0" }, cache: "no-store" });
    if (response.status >= 300 && response.status < 400) {
      const next = response.headers.get("location");
      if (!next) throw new Error("Invalid vendor redirect.");
      url = await validateUrl(new URL(next, url).href);
      continue;
    }
    if (!response.ok) throw new Error(`Vendor page failed (${response.status}).`);
    if (!(response.headers.get("content-type") || "").includes("text/html")) throw new Error("Vendor page is not HTML.");
    const html = (await response.text()).slice(0, 500000);
    const $ = cheerio.load(html);
    $("script, style, nav, footer, svg, noscript").remove();
    return { url: url.href, title: $("title").first().text().trim(), content: $("body").text().replace(/\s+/g, " ").trim().slice(0, 12000) };
  }
  throw new Error("Too many vendor redirects.");
}
