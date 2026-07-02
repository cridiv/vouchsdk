# Vouch SDK — Implementation Progress

> **Session date:** 2026-07-02  
> **Scope:** Full migration from Squad API to Nomba API across the entire monorepo, plus dependency resolution and environment setup.

---

## Repository Structure

```
vouchsdk/
├── vouch-frontend/        Next.js 14 — public landing page + auth
├── vouch-backend/         NestJS — REST API + escrow engine
└── vouch-ai-engine/       FastAPI — fraud scoring ML service
```

---

## 1. Dependency Audit & Installation (vouch-frontend)

### Problem
The frontend imported packages that were not listed in `package.json`, causing build failures.

### Packages Installed
| Package | Purpose |
|---|---|
| `@radix-ui/react-*` (slot, label, etc.) | Headless UI primitives used by shadcn components |
| `lucide-react` | Icon library used throughout components |
| `class-variance-authority` | Variant-based className utility (`cva`) |
| `clsx` | Conditional className merging |
| `tailwind-merge` | Tailwind class deduplication |
| `framer-motion` | Page/component animation (used in Hero, Features, HowItWorks, etc.) |
| `three` | 3D rendering used in background effects |
| `react-scroll-parallax` | Parallax scroll effects |
| `@supabase/supabase-js` | Supabase auth client |
| `@fingerprintjs/fingerprintjs` | Device fingerprinting for fraud signals |
| `@fontsource/dm-sans` | DM Sans font (body copy) |
| `@fontsource/syne` | Syne font (headings) |
| `@fontsource/jetbrains-mono` | JetBrains Mono font (code blocks) |

### Verification
Build confirmed passing post-install (except for missing runtime Supabase env vars during static generation, which is expected).

---

## 2. Environment Files

### `vouch-frontend/.env.example` — Created
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### `vouch-backend/.env` — Updated
Configured with test sub-account credentials (without quotation marks to avoid literal string parsing errors):
```env
NOMBA_CLIENT_ID=706df6c4-b8bb-4130-88c4-d21b052f8631
NOMBA_CLIENT_SECRET=k8UobYk3APgOoxUnNL7VpuxzwTsH4LsXtydfjcHs8RH0YISBB4OMqJsaafG+U8fWETu9YZ96bNXE+DelCDuMPw==
NOMBA_ACCOUNT_ID=f666ef9b-888e-4799-85ce-acb505b28023
NOMBA_SUB_ACCOUNT_ID=f5ee5fa7-2dc0-4030-b28c-3d81002a3285
NOMBA_WEBHOOK_URL=https://your-ngrok-url/v1/escrow/webhooks/nomba
NOMBA_WEBHOOK_SECRET=NombaHackathon2026
```

---

## 3. Frontend — Squad → Nomba Copy Migration

All user-facing text referencing Squad was systematically located and rewritten to reference Nomba. Changes were made across **5 components**:

### `app/components/About.tsx`
- Replaced `"Squad APIs"` with `"Nomba APIs"`.
- Replaced `"Squad Vaults — autonomous escrow..."` with `"Nomba Virtual Accounts — autonomous escrow..."`.

### `app/components/Features.tsx`
- Card title changed from `"Escrow & Squad Rails"` to `"Escrow & Nomba Rails"`.
- Image alt text updated to `"Escrow & Nomba Rails"`.
- Updated description to state `"Secure funds automatically using Nomba virtual accounts."`.

### `app/components/HowItWorks.tsx`
- Updated step 2 text from `"before Squad is ever called"` to `"before Nomba is ever called"`.
- Step 3 heading updated to `"Escrow via Nomba Rails"`.
- Description updated to `"A secure Nomba Virtual Account is generated exclusively..."`.
- Code comment `// Squad API returns:` updated to `// Nomba API returns:`.
- Log line changed from `✓ Generating Squad Payment Link...` to `✓ Generating Nomba Checkout Link...`.
- Code comment `// Returns Squad Audit Record:` updated to `// Returns Nomba Audit Record:`.
- Transaction reference example changed from `"SQD_abc123"` to `"NMB_abc123"`.
- Step 4 description updated to `"autonomously disbursed using a Nomba Checkout Link."`.

### `app/components/Faqs.tsx`
- Replaced `"Squad Rails"` with `"Nomba Rails"` in FAQ 1 answer.
- Replaced `"Squad Virtual Account"` with `"Nomba Virtual Account"` in FAQ 2 answer.

### `app/components/Footer.tsx`
- Tagline copyright attribution changed from `"Squad Hackathon"` to `"Nomba Hackathon"`.

---

## 4. Backend — Prisma Schema Migration

### Migration name: `20260702161453_nomba_migration`
Applied via `npx prisma migrate dev --name nomba-migration` — confirmed against the live Supabase PostgreSQL database.

### `Agreement` model — field changes

```diff
- squadVirtualAccountId String?
- squadVirtualAccountNo String?
+ nombaVirtualAccountId   String?
+ nombaVirtualAccountNo   String?
+ nombaVirtualAccountRef  String?
+ amountReceived          Float    @default(0)
```

- `nombaVirtualAccountId` — Nomba's internal ID for the virtual account.
- `nombaVirtualAccountNo` — The NUBAN bank number shown to the buyer for payment.
- `nombaVirtualAccountRef` — The `accountRef` string passed to Nomba during creation (equals `agreementId`).
- `amountReceived` — Running total of funds confirmed received via webhook (supports partial payments across multiple bank transfers).

New relation added to `Agreement`:
```prisma
nombaTransfers   NombaTransfer[]
```

### `Milestone` model — field changes

```diff
- squadTransactionId String?
- squadPaymentLinkId String?
+ nombaTransactionId String?
```

### `PlatformUser` model — relation removed

```diff
- squadSignals     SquadSignal[]
```

### `SquadSignal` model — deleted entirely, replaced by `NombaTransfer`

```prisma
model NombaTransfer {
  id                String    @id @default(uuid())
  agreementId       String
  agreement         Agreement @relation(fields: [agreementId], references: [id])
  nombaReference    String    @unique   // idempotency key — stores webhook requestId
  amount            Float
  senderName        String?
  senderBank        String?
  senderAccount     String?
  rawWebhookPayload Json
  createdAt         DateTime  @default(now())
}
```

Key design: `nombaReference @unique` is the idempotency mechanism. If Nomba retries a webhook, `prisma.nombaTransfer.create()` throws a P2002 unique constraint error, which the controller catches and silently drops.

### `EscrowStatus` enum — expanded

```diff
enum EscrowStatus {
  PENDING
+ PARTIAL       // some funds received, not yet full amount
  FUNDED
+ OVERFUNDED    // received > 101% of totalAmount
  IN_PROGRESS
  COMPLETED
  DISBURSED
+ REFUNDED      // reserved for future use
  FROZEN
}
```

### `LogEvent` enum — two new entries

```diff
+ OVERPAYMENT_FLAGGED
+ RECONCILIATION_MATCHED
```

---

## 5. Backend — Nomba Module (`src/nomba/`)

### `nomba.service.ts` — New file

**Base URL:** `https://sandbox.nomba.com`

#### Token management (private — cached in memory)
```typescript
private async getAccessToken(): Promise<string>
```
- POST `/v1/auth/token/issue` with `grant_type: 'client_credentials'`.
- **AccountId Header Fix:** Sends the parent `accountId` header with the request, resolving the authorization mismatch that caused 403 errors.
- **Nested Wrapper Resolution:** Extract token from nested response object (`response.data.data.access_token`).
- Caches `access_token` in instance memory with a 60-second pre-expiry buffer: `Date.now() + (expires_in * 1000) - 60_000`.
- Returns `this.accessToken!` asserted as non-null.

#### Request headers (private)
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json",
  "accountId": "<NOMBA_ACCOUNT_ID>"
}
```

#### `createVirtualAccount(params)` — public
POST `/v1/accounts/virtual/${subAccountId}`

```json
{
  "accountRef": "<agreementId>",
  "accountName": "<buyerName>",
  "expiryDate": null,
  "amount": <totalAmount * 100>
}
```

#### `disburse(params)` — public
POST `/v2/transfers/bank/${subAccountId}`

```json
{
  "amount": <milestone.amount>,
  "accountNumber": "<sellerAccountNumber>",
  "accountName": "<sellerAccountName>",
  "bankCode": "<sellerBankCode>",
  "merchantTxRef": "<reference>",
  "senderName": "Vouch Escrow Payout",
  "narration": "<milestone.title>"
}
```

---

### `nomba-webhook.controller.ts` — New file

**Route:** `POST /escrow/webhooks/nomba`  
**Auth mechanism:** HMAC-SHA256 signature verification.

#### HTTP request lifecycle

```
Nomba HTTP POST
  │
  ├─ 1. Check nomba-signature header present → 401 if missing
  ├─ 2. HMAC-SHA256(rawBody, NOMBA_WEBHOOK_SECRET) → compare → 401 if mismatch
  ├─ 3. JSON.parse(rawBody) → 400 if malformed
  ├─ 4. res.sendStatus(200)       ← ACK immediately before DB work
  └─ 5. setImmediate(() => reconcile(event))  ← fully async
```

---

### `nomba.module.ts` — New file

Wires the `NombaWebhookController` and `NombaService`.

---

## 6. Backend — EscrowService Migration (`src/escrow/escrow.service.ts`)

- **Constructor:** Replaced `squadService` with `nombaService`.
- **`createAgreement`:** Calls `nombaService.createVirtualAccount`, mappings updated to Nomba fields, and returns `nombaVirtualAccountNo` and `nombaBank` ('Nomba MFB').
- **Response Key Mapping Fix:** Map the returned virtual account properties correctly from Nomba's keys:
  - `nombaVirtualAccountId` = `vaData.accountHolderId`
  - `nombaVirtualAccountNo` = `vaData.bankAccountNumber`
  - `nombaVirtualAccountRef` = `vaData.accountRef`
- **`handlePaymentConfirmed`:** Removed the manual Squad `verifyTransaction` check; verification is completed upstream at signature validation. Safe default values log parameters now.
- **`confirmMilestone`:** Swapped the two-stage payment link logic for Nomba's single-stage disbursement logic via `nombaService.disburse()`.
- **`getAgreement` & `assessPaymentRisk`:** Updated mapping relations and field keys from Squad to Nomba.

---

## 7. Backend — State Transitions (`src/escrow/state/escrow.state.ts`)

Updated to accommodate the new statuses (`PARTIAL`, `OVERFUNDED`, and `REFUNDED`):
```typescript
  private readonly VALID_TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
    PENDING:     ['PARTIAL', 'FUNDED', 'OVERFUNDED', 'FROZEN'],
    PARTIAL:     ['PARTIAL', 'FUNDED', 'OVERFUNDED', 'FROZEN'],
    FUNDED:      ['OVERFUNDED', 'IN_PROGRESS', 'COMPLETED', 'DISBURSED', 'FROZEN'],
    OVERFUNDED:  ['IN_PROGRESS', 'COMPLETED', 'DISBURSED', 'FROZEN', 'REFUNDED'],
    IN_PROGRESS: ['COMPLETED', 'DISBURSED', 'FROZEN'],
    COMPLETED:   ['DISBURSED', 'FROZEN'],
    DISBURSED:   [],
    REFUNDED:    [],
    FROZEN:      [],
  };
```

---

## 8. Backend — Context Builder (`src/fraud/context/context-builder.service.ts`)

- **Prisma Query Fix:** Removed the query targeting the deleted `squadSignal` model.
- **Nomba Transfer Signals:** Swapped for `nombaTransfer` query:
  ```typescript
  latestTransfer = await this.prisma.nombaTransfer.findFirst({
      where: { agreementId },
      orderBy: { createdAt: 'desc' },
  });
  ```
- **DTO Mapping:** Maps Nomba fields to the `FraudContextDto` keys safely, matching the optional schema expectations of the machine learning service.

---

## 9. Backend — Module Wiring

- **`escrow.module.ts`:** Replaced `SquadModule` with `NombaModule` in imports.
- **`app.module.ts`:** Fully wired with all global parameters and features (including Nest `EventEmitterModule.forall()`).
- Added `ConfigModule.forRoot({ isGlobal: true })` inside `app.module.ts` imports to load environment files and resolve `ConfigService` globally.
- **`main.ts`:** Registered `express.raw` middleware on `/escrow/webhooks/nomba` to ensure signature validation can access unmodified payload bytes.

---

## 10. Verification

- Ran `npm run build` inside `vouch-backend`. Build completed successfully with **0 errors**.
- Triggered local `POST /escrow/agreements` request. The API successfully fetched a token from Nomba Sandbox and provisioned a virtual account under the sub-account, returning status `200` with the agreement record containing the NUBAN number.
- Tested the webhook integration by posting a signed mock `virtual_account.funded` event using the `scripts/simulate-webhook.js` helper.
- Verified that the webhook endpoint validated the signature successfully, returned `200 OK`, matched the transaction reference, stored the `NombaTransfer` model, incremented `amountReceived` to `1500`, and updated the agreement status to `FUNDED` inside the database.

---

## 11. Outstanding / Next Steps

| Item | Status |
|---|---|
| Register webhook URL in Nomba sandbox dashboard | 🔲 Portal config |
| vouch-ai-engine Python 3.11 virtual environment | ⏳ Diagnostics complete, pending creation |
| Statement endpoint (list transactions) | 🔲 Implementation pending |
