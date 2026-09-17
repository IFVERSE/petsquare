import { test } from "node:test";
import assert from "node:assert/strict";
import { checkWebsite, checkImageUrl } from "../lib/website-checker.js";
import { extractShopify } from "../extractors/shopify.js";

test("rejected pages and image GET fallbacks release unread response streams", async () => {
  const original = globalThis.fetch;
  let cancellations = 0;
  const response = (status, type = "text/html") => new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(65536)); },
    cancel() { cancellations++; },
  }), { status, headers: { "content-type": type } });
  try {
    globalThis.fetch = async () => response(403);
    assert.equal((await checkWebsite("https://example.com")).reason, "http_403");
    assert.equal(cancellations, 1);
    assert.equal(await extractShopify("https://example.com"), null);
    assert.equal(cancellations, 2);
    globalThis.fetch = async (_url, options) => options.method === "HEAD"
      ? response(405) : response(200, "image/jpeg");
    assert.equal(await checkImageUrl("https://example.com/image.jpg"), true);
    assert.equal(cancellations, 4);
  } finally {
    globalThis.fetch = original;
  }
});
