# Deploy PetSquare to Vercel

## Import and build

1. Sign in at https://vercel.com/new with GitHub. Import `IFVERSE/petsquare` and grant access to that repository.
2. Choose Next.js, root directory `./`, install command `npm ci`, build command `npm run build`, and leave the output directory at the Next.js default. Use Node.js 22.x.
3. Add the variables below for Production before deploying. Add Preview values only when you want preview deployments to use those services; a separate Supabase test project avoids modifying production data during preview tests.
4. Deploy and confirm the production branch is `master` in the project's Git/Environment settings. If an existing project is already connected, update its variables and redeploy instead of creating a duplicate.
5. After changing environment values, redeploy. Public variables are embedded during the build.

See [Vercel environment variables](https://vercel.com/docs/environment-variables).

## Choose the product-sync schedule before deploying

The committed `vercel.json` uses `17 3 * * *`, once daily during the 03:00 UTC hour. This frequency works on Hobby; Hobby execution time can vary within the hour. It refreshes the saved Zooplus product data. Browsing, filtering and manual refresh still read the database; manual refresh does not start a paid scrape. OSM collection runs separately through GitHub Actions. Keep `CRON_SECRET`, the Apify token and Supabase server credentials configured for the daily product sync.

Hobby is intended for personal, noncommercial use; use an appropriate paid plan for the commercial marketplace. Daily cron frequency resolves the scheduling restriction, not other account or repository restrictions.

Sources: [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Hobby plan](https://vercel.com/docs/plans/hobby).

## Environment variables

Use values from your existing `.env.local` where already configured. Do not upload that file to GitHub or paste its secrets into chat. `.env.example` lists names and non-secret defaults; it is not a working credentials file. Omit optional variables you do not use.

| Variable | Value / purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required: Supabase project URL, `https://YOUR_PROJECT.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required: the same project's public anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for signup and server operations: same project's service-role key. Keep server-only. |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | `436781288256`. Public WhatsApp contact. |
| `NEXT_PUBLIC_SUPPORT_URL` | Optional absolute HTTPS support-page URL. |
| `GROQ_API_KEY` | Required for the signed-in AI assistant and AI vendor search, not the floating app guide. Obtain from your Groq account. |
| `GROQ_MODEL` | Optional model override; current app default is `openai/gpt-oss-20b`. Must be available to your Groq account. |
| `TAVILY_API_KEY` | Required alongside Groq for AI vendor search. Obtain from your Tavily account. OSM does not need it. |
| `OSM_OVERPASS_URL` | Optional endpoint override; default `https://overpass-api.de/api/interpreter`. |
| `APIFY_API_TOKEN` | Required for scheduled Zooplus ingestion. Obtain from Apify. `APIFY_TOKEN` is an alternative name and takes precedence if both are set. |
| `APIFY_ACTOR_ID` | Optional override; app default `123webdata/zooplus-scraper`. Confirm access and actor charges in your Apify account. |
| `APIFY_MAX_ITEMS` | Optional; `50` is the app default. |
| `APIFY_INPUT_JSON` | Optional actor-specific JSON object. Without it, the app requests the Zooplus dry dog food category. |
| `CRON_SECRET` | Required when using the sync cron: generate a long random secret locally. Vercel sends it as a Bearer authorization header. |
| `LIBRETRANSLATE_URL` | Optional LibreTranslate base URL; the app appends `/translate`. |
| `LIBRETRANSLATE_API_KEY` | Optional, when your translation service requires a key. |
| `SEED_SUPER_ADMIN_EMAIL` | Local provisioning only; do not add to Vercel. |
| `SEED_SUPER_ADMIN_PASSWORD` | Local provisioning only; do not add to Vercel. |

Generate a cron secret in your own terminal:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

No Google Places, supplier-feed, database-password, `PORT`, or manually set `NODE_ENV` variable is needed. Never prefix private API keys with `NEXT_PUBLIC_`. The floating guide and WhatsApp link do not use a paid chatbot API.

Source: [securing Vercel cron jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

## Supabase setup

Reuse your existing configured database. Do not rerun the full schema/seed against it just to deploy. For a fresh empty database, apply `supabase/schema.sql`; apply `supabase/apify-pet-data.sql` when using the Apify cache. Existing databases missing vendor discovery should apply `supabase/migrations/202609160002_vendor_discovery.sql`. Demo seed data is not required for production.

In Supabase Authentication > URL Configuration, set Site URL to the final production origin, for example `https://YOUR_PROJECT.vercel.app`. Allow `https://YOUR_PROJECT.vercel.app/auth/callback` and the locale-prefixed callback URLs you use, such as `https://YOUR_PROJECT.vercel.app/en/auth/callback`. Update these for a custom domain later. Keep localhost entries only for development.

The current signup endpoint creates immediately confirmed accounts; it does not send an email-verification message. The callback is available for code-based auth flows.

Source: [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Keep the OSM worker running

OSM collection runs in GitHub Actions, separately from Vercel. In `IFVERSE/petsquare` > Settings > Secrets and variables > Actions, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Use the same database as Vercel. Then open Actions > OSM vendor scraper > Run workflow on `master`. The workflow also schedules daily at 03:23 UTC. Monitor it for failures; completion depends on upstream OSM and vendor websites. GitHub and Vercel do not automatically share secrets. The default workflow does not require Groq, Tavily or Apify.

## Verify after deployment

Visit `/en`, `/en/vendors`, `/en/deals`, and `/en/pet-data`. Test an account signup/signin, the password visibility button, mobile menu, country filters and the guide's WhatsApp link. Check Vercel runtime logs if requests fail. Confirm `/api/pet-data/sync` rejects an unauthenticated browser request with 401; only run an authenticated sync when ready to consume Apify usage. Confirm database results after the GitHub scraper completes.
