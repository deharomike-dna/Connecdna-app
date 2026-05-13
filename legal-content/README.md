# ConneCDNA Legal Content

This folder is the **single source of truth** for every legal/compliance document
shown across the ConneCDNA platform — public website, mobile app, dashboard,
and API documentation.

## Ownership

ConneCDNA operates as an affiliate platform entity under **Silvermoon Capital LLC**,
which owns all intellectual property, infrastructure, and platform rights described
in these documents.

## Conventions

- One `.mdx` file per document, named by its slug (matches `/legal/{slug}` route).
- Each file begins with YAML frontmatter:
  - `slug`, `title`, `category` (`core` | `disclosure` | `framework`)
  - `version` (semver), `effectiveDate`, `lastUpdated`
  - `requiredAtSignup` (boolean), `requiresReacceptOnUpdate` (boolean)
- Bodies are valid MDX so React components (callouts, tables) can be inlined.
- Every published change increments `version`. If `requiresReacceptOnUpdate` is
  `true` and the change is material, set `isMaterialChange: true` in frontmatter
  so the publish pipeline fans out re-acceptance rows in `policy_review_required_users`.
- The publish pipeline (`scripts/publish-legal.ts`) computes SHA-256 over the MDX
  bytes, inserts a row in `policy_versions`, and updates `legal_documents.active_version_id`.

## DO NOT

- Do not edit a published version's MDX in place. Bump the `version`, ship a new file,
  and let the pipeline insert a new `policy_versions` row.
- Do not localize jurisdiction language without counsel review.
- Do not remove the bracketed placeholders that read `[INSERT DATE]`,
  `[LEGAL NOTICES EMAIL/ADDRESS]`, `[PRIVACY CONTACT EMAIL]`, etc. without first
  populating them with the production values approved by counsel.

## Counsel review

Every document in this folder is a **template prepared for review by qualified
outside counsel**. It must not be published, posted, or relied upon prior to
counsel review and approval.
