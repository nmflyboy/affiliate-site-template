# Cloudflare Setup — Per New Site

The first time you deploy a new site, walk through this list. Allow ~10-15 minutes per site after you have the GitHub repo with built `dist/` content pushed.

Most settings persist; once a site is configured, you don't revisit. Subsequent commits auto-deploy via the GitHub connection.

## Prerequisites

- Domain registered (Cloudflare Registrar is easiest; Namecheap/GoDaddy work too)
- Domain's nameservers point to Cloudflare's nameservers
- The new site's GitHub repo exists and has `dist/` content committed

## Step 1: Create the Cloudflare Pages project

1. https://dash.cloudflare.com/ → Workers & Pages
2. Create application → Pages → Connect to Git
3. Pick the new site's repo
4. Settings:
   - Project name: matches repo name (e.g. `bestbeekeeperkits-site`)
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: **leave empty**
   - Build output directory: **dist**
   - Root directory: leave empty
5. Save and Deploy

Wait ~30 seconds. You'll get a `.pages.dev` URL like `bestbeekeeperkits-site.pages.dev`. Click it to verify the site renders.

## Step 2: Attach the custom domain

In the Pages project settings:

1. Custom domains → Set up a custom domain
2. Enter your domain (e.g. `bestbeekeeperkits.com`)
3. Cloudflare verifies and auto-configures DNS
4. Wait ~2-5 minutes for SSL provisioning
5. Add `www.bestbeekeeperkits.com` as a second custom domain too

## Step 3: SSL/TLS configuration (one-time per Cloudflare account)

These apply at the top-level Cloudflare dashboard, not the Pages project. If you've already configured these for another site, skip — they persist.

1. SSL/TLS → Overview → Mode: **Full (Strict)**
2. SSL/TLS → Edge Certificates:
   - Always Use HTTPS: **ON**
   - Auto HTTPS Rewrites: **ON**
   - Minimum TLS Version: **TLS 1.2**

## Step 4: www → apex redirect (one rule per site)

Pages already serves both www and apex, but for SEO you want one canonical version. Pick apex (cleaner). Force www to redirect:

1. Rules → Redirect Rules → Create rule
2. Rule name: `www to apex for bestbeekeeperkits.com`
3. When incoming requests match:
   - Hostname equals `www.bestbeekeeperkits.com`
4. Then: 
   - Type: Static
   - URL: `https://bestbeekeeperkits.com/$1`
   - Status code: 301
   - Preserve query string: ON
5. Deploy

## Step 5: Email routing (optional but recommended)

If you want `contact@bestbeekeeperkits.com` to forward to your personal email:

1. Email → Email Routing → Get started
2. Add destination email → enter your personal email
3. Verify destination (click the link in the confirmation email)
4. Create routing: `contact@bestbeekeeperkits.com` → your personal email
5. Verify by sending a test message

## Step 6: Web Analytics (optional)

Free, cookieless, GDPR-friendly. Alternative or supplement to GA4.

1. Analytics & Logs → Web Analytics → Add a site
2. Pick the domain
3. Cloudflare auto-injects the snippet (no code changes needed)

## Step 7: Security headers — automatically handled

The factory's `public/_headers` file deploys with every site. After your first deploy:

1. Visit https://securityheaders.com
2. Enter your domain
3. Expected grade: **A or A+**

If you see a lower grade, check Cloudflare Pages deployment logs for errors reading the `_headers` file.

## Step 8: Verify the deploy

Open your live site in an incognito window and check:

- Site loads at `https://bestbeekeeperkits.com/`
- Hero image renders
- Favicon appears in browser tab
- `/about/`, `/contact/`, `/privacy/`, `/disclosure/` all load
- `/go/[slug]` redirects to the affiliate URL
- `/nonexistent-page` returns the 404 page with HTTP 404 status (verify in DevTools Network tab)
- `https://www.bestbeekeeperkits.com/` redirects to apex
- securityheaders.com grade is A or A+
- Rich Results Test at https://search.google.com/test/rich-results passes
- PageSpeed Insights at https://pagespeed.web.dev gives mobile score ≥ 90

## Step 9: Submit to search engines

After verification:

1. Google Search Console → Add property → enter domain → verify (DNS TXT or HTML file)
2. Submit sitemap: `https://bestbeekeeperkits.com/sitemap.xml`
3. Bing Webmaster Tools → Add site → verify → submit sitemap
4. IndexNow auto-submit: visit `https://bestbeekeeperkits.com/[indexNowKey].txt` to confirm the key file is served

## Step 10: Done — ongoing deployment

Every future `git push` to main auto-deploys. No further Cloudflare clicks needed.

To deploy a content update:

```
# Make changes locally
node scripts/build-site.mjs
git add -f dist/
git commit -m "update: [what changed]"
git push
```

Within ~60 seconds, the live site reflects the change.

## What lives where

| Setting | Where in Cloudflare |
|---|---|
| GitHub connection | Workers & Pages → [project] → Settings → Build |
| Custom domain | Workers & Pages → [project] → Custom domains |
| SSL mode | SSL/TLS → Overview (account-level) |
| Always HTTPS | SSL/TLS → Edge Certificates (account-level) |
| Redirect rules | Rules → Redirect Rules (per domain) |
| Email forwarding | Email (per domain) |
| Web Analytics | Analytics & Logs → Web Analytics |
| Security headers | `public/_headers` in your repo (no Cloudflare setting needed) |

## Common issues

**`Build output directory not found`** — Cloudflare can't find `dist/`. Make sure `dist/` is committed to git (the factory's .gitignore excludes it by default; use `git add -f dist/`).

**`securityheaders.com gives a B or lower`** — The `public/_headers` file didn't deploy or has a syntax error. Check Pages deployment logs for the deploy that should have included it.

**`Custom domain stuck at "Verifying"`** — DNS hasn't propagated yet, or nameservers aren't pointed at Cloudflare. Verify with `nslookup bestbeekeeperkits.com` from PowerShell — the answer should reference Cloudflare nameservers.

**`Favicon doesn't update`** — Browser caches favicons aggressively. Open the site in an incognito window.

**`SSL pending after 10 minutes`** — Email Cloudflare support, or delete and re-add the custom domain.
