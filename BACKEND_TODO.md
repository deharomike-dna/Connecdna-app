# Backend Integration TODO

Cross-reference for the **`~/dna-healthcare`** Next.js project. The mobile app
in `~/Connecdna-app` calls the endpoints listed below. Anything marked
**Required** is hit during normal user flows and will surface visible errors
if missing or misconfigured. Anything **Optional** degrades gracefully.

The exact paths the mobile app expects live in
[`src/api/client.ts`](./src/api/client.ts) under `ENDPOINTS`. Adjust there
in one place if your route structure differs.

---

## Auth / 2FA

### `POST /api/auth/sms/send` — **Required**

Send a 6-digit OTP to the given phone via Twilio Verify (or equivalent).

```json
// Request
{ "phone": "+13055550142" }

// Response 200
{ "sent": true, "expiresInSec": 300 }
```

### `POST /api/auth/sms/verify` — **Required**

Verify a 6-digit OTP. Returns a session token on success.

```json
// Request
{ "phone": "+13055550142", "code": "123456" }

// Response 200
{ "verified": true, "sessionToken": "<jwt>" }
```

### `POST /api/auth/change-phone` — **Required**

Reset the on-file phone after a successful OTP. Server should validate
that `code` was the OTP just verified by `sms/verify` for `phone`.

```json
// Request
{ "phone": "+13055550199", "code": "123456" }

// Response 200
{ "ok": true }
```

### `POST /api/auth/2fa/request` and `POST /api/auth/2fa/verify` — Optional

Used by the in-app 2FA gate before claim submission. Currently the gate
accepts any 6-digit code on the client; wire these for real verification.

---

## Invitations

### `POST /api/invites` — **Required**

Generate a one-time invite token and dispatch it via SMS (Twilio) or email.

```json
// Request
{
  "recipient": "+13055550142",
  "method": "sms",
  "role": "org_member",
  "metadata": { "practiceId": "miami-medical-group" }
}

// Response 200
{
  "inviteId": "inv_abc123",
  "token": "tok_xyz789",
  "shareUrl": "https://connecdna.app/invite/tok_xyz789"
}
```

`role` is one of: `patient` | `org_member` | `workspace_partner`.
The token resolves on the mobile side via `CreateAccountScreen`.

---

## Claims

### `POST /api/claims/approve` — Required (currently stubbed)

Bulk-approve a batch of protected claims after T&C + 2FA in the app.

```json
// Request
{ "claimIds": ["CL-1042", "CL-1043", "CL-1044"], "twoFactorToken": "..." }

// Response 200
{ "submitted": 3, "clearinghouseRefs": ["...", "...", "..."] }
```

### `POST /api/claims/approve-one` — Required

Approve one claim from the detail sheet.

```json
// Request
{ "claimId": "CL-1042", "twoFactorToken": "..." }
```

---

## Credentials

### `POST /api/credentials/reminder` — Required

Twilio SMS reminder to a team member about an expiring credential.

```json
// Request
{ "memberId": "2", "cadence": "30_15_7" }
```

### `POST /api/credentials/renew` — Required

Submit a credential renewal with payment from a linked bank account.

```json
// Request
{
  "memberId": "2",
  "amountCents": 24500,
  "plaidAccountToken": "..."
}
```

---

## PAL Link

### `POST /api/pal/create` — Required

Generate a PAL token and short URL the patient can tap.

```json
// Request
{ "patientContact": "+13055550142", "scope": "Last 12 months of visit notes" }

// Response 200
{ "token": "ABC123", "shareUrl": "https://connecdna.app/pal/abc123" }
```

### `GET /api/pal/status?token=...` — Required

Returns the current stage (`pending` / `consented` / `wedge_active` /
`expired`). The mobile app polls this for the live timeline.

---

## Bank (Plaid)

### `POST /api/plaid/link-token` — Required

Returns a one-time Plaid Link token for the in-app bank picker.

### `POST /api/plaid/exchange` — Required

Exchange the public token returned by Plaid Link for a stored access
token server-side. Mobile app receives the masked account info to display.

```json
// Request
{ "publicToken": "public-sandbox-..." }

// Response 200
{ "accountId": "...", "bankName": "Chase", "mask": "4242", "type": "checking" }
```

---

## File Uploads (room attachments) — Optional

### `POST /api/uploads` — Optional

Workspace room composer offers a "+" button to attach a file. Mobile
currently picks the file via Expo's document picker but does **not yet**
upload bytes anywhere. To make uploads functional, expose either:

- A direct upload endpoint that accepts `multipart/form-data`, OR
- A presigned-URL handshake (`POST /api/uploads/sign` returns a Supabase /
  S3 PUT URL the client uploads to directly).

Either way, return a stable `fileUrl` the room message can reference.

```json
// Response 200 (direct upload)
{ "fileUrl": "https://storage.connecdna.app/abc.pdf", "size": 102400, "type": "application/pdf" }
```

---

## Audit

### `POST /api/audit` — Optional (best-effort, never blocks UX)

Mobile app fires-and-forgets audit events for major actions:

- `signin.completed`
- `signin.2fa.verified`
- `claims.batch.submitted`
- `claims.single.approved`
- `credential.reminder.sent`
- `credential.renewal.submitted`
- `pal.created`
- `bank.connected`
- `invite.sent`
- `phone.changed`

```json
// Request
{ "event": "claims.batch.submitted", "payload": { "count": 3 }, "ts": "2026-..." }
```

Server should also write its own audit entries for server-side actions
(webhook arrival, payment intent created, etc.). The mobile client is one
of several emitters; do not rely on it as the only source of truth.

---

## Build-stability note

If any of these endpoints are not yet implemented, the mobile app should:

1. **Not crash.** All API calls go through `request()` in `client.ts`,
   which throws a typed `ApiError` instead of crashing.
2. **Show the error message** in the UI rather than fake success.
3. **Keep audit logging in fire-and-forget mode** — `api.logAudit()`
   never throws to the caller.

When you stub a missing endpoint server-side, return a clear 501 with
`{ "message": "Not Implemented", "code": "ENDPOINT_DISABLED" }` so the
mobile app surfaces an obvious "Not Implemented" toast instead of a
generic network error.
