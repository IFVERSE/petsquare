import * as cheerio from 'cheerio';
import { checkImageUrl, checkWebsite } from './website-checker.js';

const offerWords = /\b(sales?|discounts?|offers?|flash sale|save|coupons?|promo|rabatt|angebot|aktion|soldes|offre|remise|sconto|offerta|rebajas|descuento|oferta|promocj\w*|rabat|korting|aanbieding|rea|tilbud|alennus|sleva|reducere)\b/i;
const expiryAttributes = ['data-end-date', 'data-countdown', 'data-end', 'data-deadline', 'datetime'];

function publicUrl(value, base) {
  try { const url = new URL(value, base); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}

// Only absolute, timezone-qualified deadlines are safe to replay as a countdown.
export function deadline(value, now = Date.now()) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(value ?? '')) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms > now ? new Date(ms).toISOString() : null;
}

export function extractWebsiteDetails(html, url, now = Date.now()) {
  const $ = cheerio.load(html);
  const images = [];
  function addImage(raw) {
    if (typeof raw !== 'string' || /logo|icon|sprite|pixel|badge|payment/i.test(raw)) return;
    const image = publicUrl(raw, url);
    if (image && !images.includes(image)) images.push(image);
  }
  $('meta[property="og:image"],meta[name="twitter:image"]').each((_, el) => addImage($(el).attr('content')));
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (['Product', 'Service', 'LocalBusiness', 'Store', 'VeterinaryCare'].includes(value['@type'])) {
      for (const img of [value.image].flat()) addImage(typeof img === 'object' ? img?.url : img);
    }
    for (const child of Object.values(value)) if (typeof child === 'object') {
      if (Array.isArray(child)) child.forEach(walk); else walk(child);
    }
  }
  $('script[type="application/ld+json"]').each((_, el) => { try { walk(JSON.parse($(el).text())); } catch { /* Invalid structured data. */ } });
  $('main img,article img,[class*="hero"] img,[class*="product"] img,[class*="service"] img').each((_, el) => {
    const img = $(el);
    if (Number(img.attr('width') || 600) < 240 || Number(img.attr('height') || 400) < 140) return;
    addImage(img.attr('src') || img.attr('data-src'));
  });
  const links = new Set();
  $('a[href]').each((_, el) => {
    const link = publicUrl($(el).attr('href'), url);
    if (link && new URL(link).origin === new URL(url).origin && offerWords.test(`${$(el).text()} ${new URL(link).pathname.replace(/[-/]/g, ' ')}`)) links.add(link.split('#')[0]);
  });
  $('script,style,noscript,nav,footer,[hidden],[aria-hidden="true"]').remove();
  const offers = [];
  $('[data-countdown],[data-end-date],[data-deadline],[class*="countdown"],[id*="countdown"],[class*="promotion"],[class*="promo-banner"],[class*="sale-banner"],[class*="offer"],main h1,main h2').each((_, el) => {
    const node = $(el);
    if (node.parents('[hidden],[aria-hidden="true"]').length || /display\s*:\s*none/i.test(node.attr('style') || '')) return;
    const text = node.text().replace(/\s+/g, ' ').trim();
    const context = text.length < 15 ? node.parent().text().replace(/\s+/g, ' ').trim() : text;
    if (context.length < 8 || context.length > 700 || !offerWords.test(context)) return;
    if (/\b(expired|sale ended|offer ended|abgelaufen|terminée)\b/i.test(context)) return;
    let rawEnd = expiryAttributes.map(attr => node.attr(attr)).find(Boolean);
    if (!rawEnd) {
      const child = node.find('[data-countdown],[data-end-date],time[datetime]').first();
      rawEnd = expiryAttributes.map(attr => child.attr(attr)).find(Boolean);
    }
    const endsAt = deadline(rawEnd, now);
    if (rawEnd && Number.isFinite(Date.parse(rawEnd)) && Date.parse(rawEnd) <= now) return;
    const timerSeen = !!rawEnd || /countdown/i.test(`${node.attr('class')} ${node.attr('id')}`) || node.find('[class*="countdown"],[data-countdown]').length > 0;
    const percent = /(?:up to\s+|save\s+|-)?(\d{1,2})\s*%/.exec(context);
    const discountPercent = percent && Number(percent[1]) > 0 && /%\s*(off|discount|rabatt|de réduction)|save\s+\d|up to\s+\d|[-−]\d+\s*%/i.test(context) ? Number(percent[1]) : null;
    const offer = {
      title: context.slice(0, 220), sourceUrl: url, endsAt, timerSeen,
      discountPercent, discountKind: discountPercent ? (/up to/i.test(context) ? 'up_to' : 'advertised') : 'unconfirmed',
      observedAt: new Date(now).toISOString(),
    };
    if (!offers.some(o => o.title === offer.title)) offers.push(offer);
  });
  return { images: images.slice(0, 8), offers: offers.slice(0, 5), links: [...links].filter(link => link !== url).slice(0, 3) };
}

export async function enrichWebsite(url, html, products = []) {
  const details = extractWebsiteDetails(html, url);
  for (const link of details.links) {
    const page = await checkWebsite(link);
    if (!page.ok) continue;
    const extra = extractWebsiteDetails(page.html, page.finalUrl || link);
    details.offers.push(...extra.offers);
    details.images.push(...extra.images);
  }
  const images = [];
  for (const image of [...new Set([...products.map(p => p.imageUrl).filter(Boolean), ...details.images])].slice(0, 8)) {
    if (await checkImageUrl(image)) images.push(image);
    if (images.length === 3) break;
  }
  const seen = new Set();
  const offers = details.offers.filter(offer => {
    const key = `${offer.sourceUrl}:${offer.title}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 8);
  return { images, offers, checkedAt: new Date().toISOString() };
}
