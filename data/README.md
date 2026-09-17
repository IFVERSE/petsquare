# Scraped listings

`scraped-listings.json` contains public OpenStreetMap vendor listings and validated
products refreshed during the scrape window recorded in its `since` field.
It is a data snapshot for version control. The application continues to read live
listings from Supabase, where the scraper inserts and updates accepted results.

Refresh the snapshot after a scraper run, using that run's UTC start timestamp:

```powershell
node scripts/export-scraped-data.mjs --since=<ISO-timestamp>
```

The export requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
in `.env.local`. It exports an explicit list of public listing fields.

Discovery searches all 44 configured countries and nine categories when run with:

```powershell
npm.cmd run scrape -- --provider=osm --nationwide --vendor-limit=100
```

Each search is capped at 100 results. Missing websites, failed validation, and
upstream search errors can reduce coverage. A snapshot does not establish that
every business or country/category search was successfully covered.

To resume an interrupted run at a specific category, add `--start-at=BE:shelter`
(substitute the interrupted country/category). Repeating that category safely
updates existing listings by their OpenStreetMap identity.

OpenStreetMap data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright),
available under the Open Database License. Website descriptions, images, and
offers retain their respective owners' rights; source URLs identify their origin.
