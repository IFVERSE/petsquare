import { europe } from "../shared/europe.js";
// scraper/queries.js
//
// Seed queries fed to Tavily and the AI vendor extraction agent.
// market is enough to prove the pipeline end-to-end — expand this list (or
// swap in a full city table from Supabase) once you're ready to scale up.

export const seedCities = {
  RO: "Bucharest", PL: "Warsaw", CZ: "Prague", HU: "Budapest",
  DE: "Berlin", GB: "London", FR: "Paris", IT: "Milan",
  ES: "Madrid", AT: "Vienna", SE: "Stockholm", PT: "Lisbon",
};


const countryNames = Object.fromEntries(Object.entries(europe).map(([code, info]) => [code, info[0]]));
const categoryTerms = ["pet store flash sale", "pet supplies offers", "online pet store", "veterinary", "pet grooming offers", "pet boarding", "pet training", "dog walking", "animal shelter adoption", "pet memorial services", "pet breeders"];

export function buildSeedQueries({ countries = Object.keys(europe) } = {}) {
  const queries = [];
  for (const code of countries) {
    const city = seedCities[code] || countryNames[code];
    if (!city) continue;
    for (const term of categoryTerms) {
      queries.push(`${term} in ${city}, ${countryNames[code]} official website -blog -guide -directory`);
    }
  }
  return queries;
}
