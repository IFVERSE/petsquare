// scraper/lib/website-checker.js
import { config } from "../config.js";

// Approximate "registrable domain" — good enough for flagging an unrelated
// redirect without pulling in a full public-suffix-list dependency. Doesn't
// correctly handle two-part TLDs like co.uk, but false positives there just
// mean a manual re-check, not a bad vendor getting through.
function registrableDomain(hostname) {
  const parts = hostname.split(".");
  return parts.slice(-2).join(".");
}

/**
 * Rule 4 + Rule 9: fetch the vendor's website, follow redirects, and report
 * whether it's actually reachable, functional, and not a parked/squatted
 * domain or a redirect to an unrelated site.
 */
export async function checkWebsite(url) {
  if (!url) {
    return { ok: false, reason: "no_website_listed" };
  }

  let originalHost;
  try {
    originalHost = new URL(url).hostname;
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PetSquareBot/1.0; +https://petsquare.example/bot)",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}`, finalUrl: res.url };
    }

    const finalHost = new URL(res.url).hostname;
    const redirectedToUnrelatedDomain =
      registrableDomain(finalHost) !== registrableDomain(originalHost);

    const html = await res.text();

    const lowerHtml = html.toLowerCase();
    const parked = config.parkedDomainSignals.some((signal) => lowerHtml.includes(signal));
    if (parked) {
      return { ok: false, reason: "parked_domain", finalUrl: res.url };
    }

    if (html.length < config.minHtmlBytesForRealSite) {
      return { ok: false, reason: "page_too_small", finalUrl: res.url };
    }

    if (redirectedToUnrelatedDomain) {
      return {
        ok: false,
        reason: "redirected_to_unrelated_domain",
        finalUrl: res.url,
        originalHost,
        finalHost,
      };
    }

    return { ok: true, finalUrl: res.url, html };
  } catch (err) {
    clearTimeout(timeout);
    const reason = err.name === "AbortError" ? "timeout" : "unreachable";
    return { ok: false, reason, error: err.message };
  }
}

/**
 * Rule 16: confirm a product image URL is actually reachable (HEAD request,
 * GET fallback since some CDNs reject HEAD).
 */
export async function checkImageUrl(url) {
  if (!url) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.imageCheckTimeoutMs);
  try {
    let res = await fetch(url, { method: "HEAD", signal: controller.signal });
    if (!res.ok) res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return res.ok && (res.headers.get("content-type") || "").startsWith("image");
  } catch {
    clearTimeout(timeout);
    return false;
  }
}
