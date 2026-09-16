export function activeOffers(offers, now = Date.now()) {
  if (!Array.isArray(offers)) return [];
  return offers.filter(offer => {
    if (!offer || typeof offer.title !== 'string' || !/^https?:\/\//i.test(offer.sourceUrl ?? '')) return false;
    const checked = Date.parse(offer.observedAt);
    if (!Number.isFinite(checked) || checked > now || now - checked > 48 * 3600000) return false;
    return !offer.endsAt || Date.parse(offer.endsAt) > now;
  });
}
