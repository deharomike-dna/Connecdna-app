# Mobile Legal & Compliance — Integration Guide

This package adds Fortune-500-grade legal placement to the existing Expo app.
It is intentionally additive: nothing in this folder modifies existing screens.
Wiring into the running app takes ~5 small edits, listed below.

## Files added

```
src/legal/
├── types.ts                                  # Shared types
├── registry.ts                               # Catalog of slugs / required-at-signup list
├── disclosures.ts                            # Canonical disclaimer strings
├── acceptanceService.ts                      # Supabase RPC wrappers
├── policyContent.ts                          # Bundled MD imports for offline access
├── components/
│   ├── TransactionDisclosureBanner.tsx       # Persistent banner + auto-records view
│   ├── PolicyCheckboxBundle.tsx              # Signup acceptance checkboxes
│   └── IntegrationsDisclosure.tsx            # Settings → Integrations card
├── screens/
│   ├── LegalCenterScreen.tsx                 # Mobile Legal Center (More tab item)
│   ├── PolicyViewerScreen.tsx                # In-app markdown viewer
│   └── ReacceptanceGate.tsx                  # Forced re-acceptance after material updates
├── index.ts                                  # Public exports
└── INTEGRATION.md                            # This file
```

## One-time setup

### 1. Bundle markdown as strings

Metro doesn't load `.md` as strings out of the box. Add this to
`metro.config.js` (create the file at the repo root if it doesn't exist):

```js
const { getDefaultConfig } = require('expo/metro-config')
const config = getDefaultConfig(__dirname)
config.resolver.assetExts = config.resolver.assetExts.filter((e) => e !== 'md')
config.resolver.sourceExts = [...config.resolver.sourceExts, 'md']
module.exports = config
```

Then add a tiny transformer that returns the file contents as a default
export. Easiest path: `npm i -D babel-plugin-inline-import` and add
`['inline-import', { extensions: ['.md'] }]` to `babel.config.js` plugins.

### 2. Sync the canonical legal content into mobile assets

After every legal-content edit, run:

```
node scripts/sync-legal-to-mobile.js
```

This script copies `legal-content/<slug>.mdx` → `assets/legal/<slug>.md`,
stripping the YAML frontmatter so the body matches what the website renders.
(See the script in this PR.)

### 3. Add Supabase RPCs

The acceptance service calls two RPCs that don't yet exist; create them in a
follow-up migration. Both use `security definer` so they can write to
append-only tables behind RLS.

- `record_policy_acceptance(p_document_slug, p_policy_version_id, p_content_sha256, p_acceptance_context, p_organization_id, p_geographic_region, p_jurisdiction, p_device_metadata)` — inserts a row into `policy_acceptances` and a matching `policy.accepted` row into `audit_log_events`.
- `record_transaction_disclosure_view(p_workflow_id, p_workflow_type, p_disclosure_version, p_surface, p_organization_id)` — inserts into `transaction_disclosure_views` and an `audit_log_events` `disclosure.shown` row.

Both should pull `auth.uid()`, the request IP, and the User-Agent from
`request.headers` so client code never has to send them.

## Wiring into existing screens

### A. Show acceptance checkboxes in `CreateAccountScreen`

```tsx
import { PolicyCheckboxBundle, allRequiredAccepted, recordAcceptanceBundle, REQUIRED_AT_SIGNUP } from '../legal'

const [accepted, setAccepted] = useState<Set<LegalSlug>>(new Set())
const [openSlug, setOpenSlug] = useState<LegalSlug | null>(null)

// In your form layout, above the "Create account" button:
<PolicyCheckboxBundle
  accepted={accepted}
  onToggle={(s) => {
    const n = new Set(accepted)
    n.has(s) ? n.delete(s) : n.add(s)
    setAccepted(n)
  }}
  onOpen={setOpenSlug}
/>

// On submit, AFTER auth.signUp succeeds:
await recordAcceptanceBundle(
  REQUIRED_AT_SIGNUP.map((d) => d.slug),
  'signup',
  organizationId,
)
```

The "Create account" button should be disabled until `allRequiredAccepted(accepted)` returns true.

### B. Add the Legal Center to the More tab

In `MenuScreen.tsx`, add a row that calls `navigation.navigate('LegalCenter')`.
In `AppNavigator.tsx`, add `<Stack.Screen name="LegalCenter" component={LegalCenterScreen} />` (or render inside the MenuScreen flow).

### C. Mount the re-acceptance gate

In `App.tsx`:

```tsx
import { ReacceptanceGate } from './src/legal'

return (
  <NavigationContainer>
    <ReacceptanceGate>
      <AppNavigator />
    </ReacceptanceGate>
  </NavigationContainer>
)
```

### D. Show the persistent banner on transaction-class screens

Any screen that initiates a payment / settlement / banking-API workflow:

```tsx
<TransactionDisclosureBanner workflowId={claim.id} workflowType="payment" />
```

Mounting the component records evidence the disclosure was shown.

### E. Show the integrations card on Settings → Integrations

```tsx
<IntegrationsDisclosure onOpenFullDisclosure={() => navigation.navigate('PolicyViewer', { slug: 'api-data' })} />
```
