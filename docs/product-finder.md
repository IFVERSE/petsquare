# Product finder

`/pet-data` combines saved Zooplus data with active products from verified PetSquare
vendors. It works when either source is empty or unavailable. No sample listings
are inserted and page visits never start a paid scraper.

Visitors can:

- Search names, brands, descriptions and retailers.
- Filter by pet, category, retailer country, currency, maximum price, availability,
  price reductions and checks within 48 hours.
- Compare up to three products, including supplied pack sizes and calculated unit
  prices. Currency selection is required for price sorting or budget filters.
- Save up to 100 products in this browser without signing in; saved snapshots remain
  accessible when an item is absent from the latest feed.
- Copy a shareable search link containing filters, without sharing the shortlist.
- Browse retailer locations when supplied, refresh saved data, and load more results.

Country preference uses the existing `petsquare-country` cookie. Country refers to
the explicit market or a recognized retailer country domain, not shipping coverage.
Products with no identified country appear under All countries. Pet and category
labels are browsing aids inferred from supplied product information.

`GET /api/pet-data` now returns normalized `items`, source readiness states and a
`capped` flag. It reads up to 100 cached Zooplus entries and 500 active vendor products,
deduplicates identical source URLs while preserving variant query parameters, and
omits expired/not-yet-started offers and unsafe/missing source URLs. Missing prices,
currency and stock remain unknown. Source failures preserve already loaded results.

Refresh reads the database; it does not launch Apify or a website scrape. The existing
Apify cron and vendor scraper remain responsible for collecting new data. No new
database migration is required for this page. Shortlists use browser local storage,
not the account-wide saved-items database; clearing browser storage removes them.

## Checks

```sh
npm run test:products
npm run build
npm run start -- --port 3100
```

With the app running, run `npm run test:products:browser`. The browser test uses
installed Chrome by default (`TEST_BROWSER` can select another installed channel),
and `TEST_URL` can override the default `http://localhost:3100/en/pet-data`.
It covers filters, comparison limits, browser persistence, share links, failed-source
retention, empty recovery and mobile layout, then saves a real-data screenshot to
`test-results/product-finder-desktop.png`.
