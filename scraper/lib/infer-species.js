// scraper/lib/infer-species.js
//
// The scraper's product extractors don't get a structured species field from
// any of the three source strategies (Shopify JSON, JSON-LD, or heuristic
// HTML), so Phase 4's species-based personalization would have nothing to
// match against. This does simple multilingual keyword matching over a
// product's name + description as a reasonable stand-in — it will
// occasionally miss or over-match, same caveat as the heuristic price
// extractor, but it's far better than leaving every scraped product
// unmatched to any pet type.

const KEYWORDS = {
  dog: ["dog", "puppy", "hund", "welpe", "chien", "cane", "perro", "cão", "pies", "szczeniak", "pes", "kutya", "câine"],
  cat: ["cat", "kitten", "katze", "chat", "gatto", "gato", "kot", "kotě", "macska", "pisică"],
  bird: ["bird", "parrot", "vogel", "papagei", "oiseau", "uccello", "pájaro", "ave", "ptak", "papuga", "pták", "madár", "pasăre"],
  fish: ["fish", "aquarium", "fisch", "aquarium", "poisson", "aquarium", "pesce", "acquario", "pez", "acuario", "peixe", "ryba", "akvárium", "hal", "pește"],
  exotic: ["rabbit", "hamster", "guinea pig", "reptile", "kaninchen", "lapin", "coniglio", "conejo", "coelho", "królik", "králík", "nyúl", "iepure"],
};

/**
 * Returns an array of Species codes (a subset of dog|cat|bird|fish|exotic)
 * inferred from free text — used for both product.species and, via
 * aggregation in validate.js, vendor.species.
 */
export function inferSpecies(...texts) {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  const matches = [];
  for (const [species, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((kw) => haystack.includes(kw))) matches.push(species);
  }
  return matches;
}
