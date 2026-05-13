# ConneCDNA — Public Website

Next.js 14 App Router site for ConneCDNA, an affiliate platform of **Silvermoon Capital LLC**.

## Layout

```
website/
├── app/
│   ├── layout.tsx                # Header + Footer wrap
│   ├── page.tsx                  # Marketing home
│   └── legal/
│       ├── page.tsx              # Index of all legal documents
│       └── [slug]/page.tsx       # Renders /legal-content/<slug>.mdx
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx                # Permanent "Legal" footer (8 routes)
│   └── DisclosureBanner.tsx      # Persistent non-custodial disclosure banner
├── lib/legal.ts                  # MDX loader + canonical footer slug list
├── scripts/publish-legal.ts      # Pushes MDX versions to Supabase
└── package.json
```

## Source of truth

Every legal document body lives at the **repo-root** path
`../legal-content/<slug>.mdx`. The website renders those files at build time;
the mobile app consumes the same files via `scripts/sync-legal-to-mobile.ts`.

To add or update a policy:

1. Edit (or add) the MDX file under `/legal-content`.
2. Bump `version` in frontmatter; set `isMaterialChange: true` if the change
   triggers a re-acceptance event for existing users.
3. Commit, deploy, and run `npm run publish-legal` against your Supabase
   project (requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).

The `policy_versions` AFTER-INSERT trigger fans out review-required rows for
every existing user when `is_material_change` is true.

## Required footer routes

The footer (rendered on every public page) links to all eight required
legal disclosures, per the placement architecture:

- `/legal/terms` — Terms of Service
- `/legal/privacy` — Privacy Policy
- `/legal/fees` — Fee Disclosure Policy
- `/legal/non-custodial` — Non-Custodial Disclosure
- `/legal/payment-processor` — Third-Party Processor Disclosure
- `/legal/api-data` — API & Data Usage Disclosure
- `/legal/identity-verification` — Identity Verification Disclosure
- `/legal/compliance-audit` — Compliance & Audit Logging Disclosure

The slug-to-label mapping lives in `lib/legal.ts` and is the single place
any edit needs to happen.
