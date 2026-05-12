# Migrating Existing Lovable Sites to This Template

How to migrate an existing Lovable.dev-built site (BrewVerdict, FairwayVerdict, HydroVerdict, etc.) to the rules-driven, Cloudflare-Pages-deployed workflow defined in this template.

## Migration is OPTIONAL

The existing Lovable-built sites continue to work. Migration is a quality and control upgrade, not a fix for a broken system. Consider migrating a site when:

- You want to retrofit a new rule (e.g. updated ItemList schema, new EEAT requirements) and don't want to manually re-prompt Lovable
- Lovable Cloud hosting limits are blocking an audit you care about (security headers, HTTP 404, render-blocking JS)
- You want full Git history of every content change going forward
- You're reorganizing the site significantly anyway

## Migration prerequisites

- The site's domain is already in your Cloudflare account
- The site's affiliate links and Amazon tag are documented
- The site's IndexNow key is captured
- You have at least 60 minutes of focused time per site (the first migration takes longer; later ones speed up as the muscle memory builds)

## Step-by-step migration

### Step 1: Capture the existing site

Before touching anything, snapshot the live site for reference:

```
cd C:\code\sites
mkdir captures
cd captures
wget --mirror --convert-links --adjust-extension --page-requisites --no-parent https://[domain]
```

(or use `Save Page As` in the browser if wget is not installed)

This gives you the rendered HTML output of the existing site for content extraction.

### Step 2: Spin up a new site repo from this template

On github.com, navigate to the template repo and click "Use this template":

- New repo name: `[domain]-site` (e.g. `brewverdict-site`)
- Visibility: Private
- Note: this may conflict with an existing repo if you already have one named the same. Rename the existing repo first (Settings → Rename) to `[domain]-site-lovable` for archival, then create the new one.

### Step 3: Clone the new repo locally

```
cd C:\code\sites
git clone https://github.com/nmflyboy/[domain]-site.git
cd [domain]-site
code .
```

### Step 4: Build the site-config.json from existing content

Copy the sample config:

```
copy configs\_sample-config.json site-config.json
```

Then in VS Code, fill in `site-config.json` using values extracted from the existing live site:

- **site.domain** — from the existing URL
- **site.brandName, tagline, editorialTeamName** — from the existing site header and About page
- **site.namedAuthor** — set to "Robin Lilly" (new for v3.3 EEAT)
- **site.contactEmail** — from existing contact info
- **site.niche** — describe the existing niche
- **seo.primaryKeyword** — extract from existing `<title>` and meta description
- **seo.quickAnswer** — copy the existing Quick Answer text (verify it's 40-50 words; tighten or pad if needed)
- **seo.indexNowKey** — copy the existing IndexNow key (do not regenerate; that would lose existing indexing relationships)
- **seo.ga4MeasurementId** — copy from existing GA4 setup
- **template.type** — match what the existing site is (probably `listicle` for the Verdict family)
- **template.handsOnReview** — false unless you've actually tested products for that site
- **design.primaryColor, accentColor, darkestBrandColor** — extract from existing site CSS (use a color picker in DevTools)
- **affiliate.amazonTag** — copy from existing /go/ redirects or affiliate URLs
- **affiliate.products** — for each existing product, fill in name, slug (matches existing /go/ URL), affiliateLink (extract from existing /go/ redirect file), shortDescription, pros, considerations, verdict, specificDetail
- **content** fields — extract from existing About page and methodology section
- **riskTier** — match existing (3 for general consumer; 1 for cold plunge/ice bath; 2 for financial)

### Step 5: Build the new site

In VS Code terminal:

```
claude
```

> Build this site using site-config.json. Read CLAUDE.md and apply all mandatory rules. Generate output to dist/. This is a migration from an existing Lovable build at https://[domain]/ — match the existing brand voice and product details as closely as possible while complying with all rules.

Claude Code generates `dist/`.

### Step 6: Compare to the existing site

Open `dist/index.html` side by side with the live site in the browser. Verify:

- All products from the existing site are present (in the same order)
- The Quick Answer reads similarly to the existing one
- Brand colors look right
- The hero image is present (you may need to copy the actual hero image file into `public/og-images/` if the existing site's image wasn't already saved locally)
- Footer copy matches

Note: the migrated version will likely have BETTER copy in places where v3.2 rules weren't followed (em dashes, slop phrases). This is expected and desirable — do not "restore" violations.

### Step 7: Run validation

> Validate the generated output in dist/ against all mandatory rules. Report any violations.

Fix violations one at a time. Common issues during migration:

- Hero image not yet downloaded into `/public/` — copy it from the captured site or download from the existing site
- Quick Answer outside the 40-50 word range — adjust the text in `site-config.json` and rebuild
- Missing `namedAuthor` — was not in the original v3.2 Phase 0; add now
- Missing `specificDetail` per product — synthesize from product knowledge or pull from existing product card copy

### Step 8: Commit the migrated repo

> Commit all files with message `feat(site): initial migration from Lovable build` and push to main.

### Step 9: Cloudflare Pages connection

In Cloudflare Pages dashboard:

- Create new project → Connect to GitHub → select `[domain]-site` repo
- Build settings: leave build command empty (static site); set output directory to `dist`
- Save and deploy

First deployment takes 2-3 minutes. Note the preview URL Cloudflare assigns (e.g. `brewverdict-site.pages.dev`).

### Step 10: Cutover the production domain

This is the moment you switch the live site from Lovable to Cloudflare Pages.

In Cloudflare DNS:

- Note the current A and CNAME records for the domain (write them down in case of rollback)
- Update the A record (`@`) to point to Cloudflare Pages (Cloudflare Pages dashboard provides the exact target)
- Update the CNAME record (`www`) to point to the same
- Keep orange-cloud proxy ON

In Cloudflare Pages → your project → Custom domains:

- Add the production domain
- Add `www.[domain]` too

Propagation takes 1-5 minutes typically. Verify by visiting `https://[domain]` in incognito.

### Step 11: Post-migration verification

- Lighthouse mobile score should jump significantly from the Lovable Cloud baseline (typically +5 to +20 points from removed render-blocking and proper caching)
- securityheaders.com grade should now be A or A+ (it was C on Lovable Cloud)
- `curl -I https://[domain]/nonexistent` should now return HTTP 404, not 200
- /go/ redirects should work as before
- robots.txt and sitemap.xml should serve correctly
- IndexNow key file should serve at `/[indexNowKey].txt`

### Step 12: Decommission the Lovable site

Once you're confident the Cloudflare Pages site is healthy:

- In Lovable, you can leave the project in place (no harm in it existing) or delete it
- The old `[domain]-site-lovable` GitHub repo can be archived (Settings → Archive) to preserve history while marking it as read-only
- Update your memory notes / project tracker that this site is now on the new system

## Order of migration (recommended)

Migrate in this order:

1. **Pick your least valuable / lowest-traffic site first** to learn the process. For Robin: bestsurvivaltips.com or one of the early sites.
2. **Migrate one Verdict-family site** second to validate the workflow on a site you care about (BrewVerdict suggested, since it's the most stable).
3. **Migrate remaining sites** one per week as time allows.

Migrating all 20 sites in one weekend is possible but not recommended — the muscle memory and learnings from each migration improve the next.

## Rollback

If a migration goes wrong, rollback is fast:

1. In Cloudflare DNS, restore the original A and CNAME records pointing back to Lovable
2. In Cloudflare Pages, remove the custom domain from the new Pages project (it'll keep the .pages.dev URL for testing)
3. The old Lovable site comes back online in 1-5 minutes

You do not lose anything by rolling back. The new repo and its commits stay; you can fix issues and re-cutover when ready.
