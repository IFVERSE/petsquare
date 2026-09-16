import assert from "node:assert/strict";
import { coordinates, safeMapLink } from "../src/lib/map-data.ts";

assert.deepEqual(coordinates("6.5244", "3.3792"), [6.5244, 3.3792]);
assert.deepEqual(coordinates(0, 3), [0, 3]);
assert.deepEqual(coordinates(3, 0), [3, 0]);
for (const pair of [[null, 3], [0, 0], [91, 0], [2, 181], ["", 4], [" ", 4], [NaN, 1], [true, 4], [[], 4]]) {
  assert.equal(coordinates(...pair), null);
}
assert.equal(safeMapLink("javascript:alert(1)"), "");
assert.equal(safeMapLink("//evil.example"), "");
assert.equal(safeMapLink("/en/vendors/shop"), "/en/vendors/shop");
assert.equal(safeMapLink("https://example.com/product"), "https://example.com/product");
console.log("Map coordinate and URL checks passed");
