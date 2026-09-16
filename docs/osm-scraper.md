# OSM vendor discovery, images and offers

## Setup and testing

Copy `.env.example` to `.env.local` and configure the Supabase URL, anon key and
service-role key. Apply `supabase/migrations/202609160002_vendor_discovery.sql` in
Supabase SQL Editor before running the enriched scraper against an existing project.
It adds a JSON evidence field and an index without deleting vendors. Fresh projects
using `supabase/schema.sql` already include the field.

```sh
npm run scrape:osm:test
npm run scrape:enrichment:test
npm run scrape:test
npm run scrape -- --dry-run --countries=DE --categories=grooming --vendor-limit=3
npm run scrape -- --countries=DE,FR,ES --categories=retailer,grooming --nationwide --vendor-limit=30
npm run build
```

With the app running on port 3100, `npm run test:discovery:browser` checks the
photo fallback, promotions, country persistence, pagination and mobile layout.
Set `TEST_URL` for another address; the test uses installed Chrome by default.

`--dry-run` never writes. Accepted vendors are saved as each completes in normal
runs, so the frontend can update during long runs. Existing slugs remain stable;
new slugs include an identity suffix to distinguish branches with the same name.

OSM discovery needs no Google, Tavily or Groq key. Optional `--provider=ai` uses
Tavily/Groq; direct `--urls` seeds also require Groq.

## Coverage and automation

44 countries and nine categories are configured in `shared/europe.js`: pet retail,
veterinary, grooming, boarding, training, walking, shelters/adoption, memorial and
breeding. Categories use [OSM animal tags](https://wiki.openstreetmap.org/wiki/Animals).
Coverage is limited by OSM completeness; dog walking is particularly sparse.

`--nationwide` queries each country's OSM boundary; otherwise each country uses one
seed centre. `--vendor-limit=1..100` caps each country/category query (default 30).
`--limit` caps country/category searches. This is bounded discovery, not an exhaustive
crawl of every European vendor. Small limits can repeatedly return the same entries.

```sh
npm run scrape -- --nationwide
```

The GitHub Actions workflow runs daily at 03:23 UTC, or manually. Add repository
secrets `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then push the
project to GitHub to activate it. Seven country groups run sequentially with one
Overpass request at a time and three website validators. A full refresh can take
hours. The worker records failures and exits unsuccessfully when errors occur.
Inspect saved run history at `/admin/scraper`.

## Media and promotions

Up to three reachable photos are collected from product data, structured data,
social preview metadata and large website content images. Missing/broken images
use bundled illustrative photographs with a gentle pan/zoom animation. Reduced-motion
preferences disable it. Photos are not claimed to depict the listed vendor; sources
are in `docs/photo-sources.md`. Old rows receive these fallbacks immediately; re-scrape
them after migration to collect their own media and offer evidence.

The homepage and `/deals` include a website-promotions feed, alongside products with
validated original/sale prices. The scraper checks the homepage and up to three
same-origin offer pages for common European promotion terms and countdown attributes.
Advertised percentages retain ?up to? wording. Unknown savings are labelled as an
unconfirmed offer, without inventing a discount. Only a timezone-qualified future
deadline drives a countdown. Other timers say the end time is unconfirmed. Expired
offers and evidence older than 48 hours are hidden. Visitors are directed to check
prices, savings, eligibility and availability on the vendor website.

JavaScript-only timers, consent-gated pages and unusual markup may be missed. OSM
provides no verified rating or operating status; the scraper does not invent them.

## Frontend and API

The inline country prompt is remembered in a one-year browser cookie. It personalizes
trending product deals and filters vendor, deal and discovery listings. It represents
the vendor's country, not a claim that a vendor delivers to the visitor. Category
filters and ?More discoveries? paginate 24 vendors at a time.

`GET /api/places/recent?country=DE&category=grooming&page=0&offers=true` is public and
reads saved, verified OSM vendors using Supabase's public read policy. It never runs
a live scrape. The homepage refreshes every minute while visible. Missing migration
fields fall back to the existing cover image; offer evidence needs the migration.
Dry runs and unsaved discovery searches do not populate the public feed.

`GET /api/places?country=DE&radius=10000&limit=50&category=grooming` is an admin-only
discovery endpoint requiring `scraper.manage`. Radius is 100?25000 metres, limit is
1?100, and category defaults to all. Next.js registers both routes automatically.

Data ? [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), under
ODbL. Retain attribution when displaying or exporting it. The supplier catalogue
code and original migration were removed; previously applied remote supplier tables
are unaffected by these changes.
