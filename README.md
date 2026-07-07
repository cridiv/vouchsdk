<div align="center">

# { vouch }.sdk

**The Trust Infrastructure Layer for Digital Commerce**

A full-stack, production-ready platform that gives any application a complete identity verification, escrow payments, and real-time fraud detection system — deployable in minutes via a single TypeScript SDK.

[![npm version](https://img.shields.io/npm/v/vouch-sdk?color=%2358a0b4&label=vouch-sdk&style=flat-square)](https://www.npmjs.com/package/vouch-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Backend](https://img.shields.io/badge/API-NestJS-red?style=flat-square&logo=nestjs)](https://vouchsdk.onrender.com)
[![AI Engine](https://img.shields.io/badge/ML-FastAPI-green?style=flat-square&logo=python)](https://vouch-2uoc.onrender.com/docs)
[![Frontend](https://img.shields.io/badge/Dashboard-Vercel-black?style=flat-square&logo=vercel)](https://vouch-sdk.vercel.app)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Live Deployments](#live-deployments)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Quick Start](#quick-start)
- [SDK Reference](#sdk-reference)
  - [Identity Verification](#identity-verification)
  - [Fraud Assessment](#fraud-assessment)
  - [Escrow Agreements](#escrow-agreements)
- [REST API Reference](#rest-api-reference)
- [AI Engine](#ai-engine)
- [Verification Modal](#verification-modal)
- [Demo Application](#demo-application)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Vouch** is a trust platform SDK designed for marketplaces, gig economy apps, P2P platforms, and fintech products. It provides three core primitives through a unified TypeScript client:

| Primitive | What it does |
|---|---|
| 🪪 **Identity Verification** | Biometric face + document scan via a hosted modal or direct API upload |
| 🔒 **Escrow Agreements** | Milestone-based escrow using Nomba Virtual Accounts (NUBAN rails) |
| 🚨 **Fraud Assessment** | ML-powered transaction risk scoring (GREEN / AMBER / RED) with device fingerprinting |

> **Design philosophy:** Vouch wraps complex regulatory and ML infrastructure behind a clean 3-method SDK surface. A developer can add production-grade trust primitives to their app in under 10 minutes.

---

## Live Deployments

| Service | URL | Description |
|---|---|---|
| **Developer Dashboard** | [vouch-sdk.vercel.app](https://vouch-sdk.vercel.app) | Landing page, API key management |
| **Verification Modal** | [vouchsdk-modal.vercel.app](https://vouchsdk-modal.vercel.app) | Hosted biometric KYC modal |
| **REST API** | [vouchsdk.onrender.com](https://vouchsdk.onrender.com) | NestJS backend API |
| **AI/ML Engine** | [vouch-2uoc.onrender.com](https://vouch-2uoc.onrender.com) | FastAPI ML service |
| **Demo App** | [vouchsdk-demo.vercel.app](https://vouchsdk-demo.vercel.app) | Full-stack demo (Plica freelance marketplace) |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Your Application                            │
│                                                                  │
│   import Vouch from 'vouch-sdk'                                  │
│   const vouch = new Vouch('vch_YOUR_API_KEY')                    │
└───────────────────┬─────────────────────────────────────────────┘
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              Vouch REST API  (NestJS on Render)                  │
│                 vouchsdk.onrender.com                            │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  /identity  │  │   /escrow    │  │       /fraud         │   │
│  │   verify    │  │  agreements  │  │       assess         │   │
│  └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                │                      │               │
│         │ multipart      │ Nomba API             │ HTTP POST     │
│         ▼                ▼                      ▼               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Vouch AI   │  │    Nomba     │  │    Vouch AI Engine   │   │
│  │  Engine     │  │  Virtual     │  │    (fraud scoring)   │   │
│  │  (FastAPI)  │  │  Accounts    │  │    XGBoost + SHAP    │   │
│  │  DeepFace   │  │  (NUBAN)     │  │                      │   │
│  └─────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL (Prisma ORM / Supabase)           │   │
│  │         Agreements · PlatformUsers · DeveloperLogs       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│              Verification Modal (Next.js on Vercel)            │
│              vouchsdk-modal.vercel.app/verify                  │
│                                                                │
│  Loaded in an iframe by the SDK. Communicates via             │
│  window.postMessage() → resolves vouch.identity.verify()      │
└───────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
vouchsdk/
├── vouch-sdk/          # 📦  npm package — TypeScript SDK (vouch-sdk on npm)
├── vouch-backend/      # ⚙️   REST API — NestJS + Prisma + PostgreSQL
├── vouch-ai-engine/    # 🤖  ML Service — FastAPI + DeepFace + XGBoost
├── vouch-frontend/     # 🌐  Public Website — Next.js developer dashboard
├── modal/              # 🪟  Verification Modal — Next.js hosted KYC UI
├── vouch-demo/         # 🎬  Demo App — "Plica" freelance marketplace
└── docs/               # 📖  Documentation — Mintlify MDX
```

---

## Quick Start

### 1. Install

```bash
npm install vouch-sdk
# or
pnpm add vouch-sdk
```

Get your API key from the [Developer Dashboard](https://vouch-sdk.vercel.app).

### 2. Initialize

```typescript
import Vouch from 'vouch-sdk';

const vouch = new Vouch('vch_YOUR_API_KEY');
```

### 3. Add Biometric Identity Verification

```typescript
// Launches a hosted biometric modal — no UI to build
const result = await vouch.identity.verify(user.email);

if (result.data.identityVerified) {
  console.log('✅ Identity confirmed!', result.data.identityMatchScore);
}
```

### 4. Run a Fraud Check Before a Transaction

```typescript
const risk = await vouch.fraud.assess({
  platformUserId: user.email,
  transactionAmount: 50000,
});

if (risk.flag === 'RED') {
  // Block the transaction
} else {
  // Safe to proceed
}
```

### 5. Create a Milestone-Based Escrow Agreement

```typescript
const agreement = await vouch.escrow.create({
  buyerExternalId:  buyer.email,
  sellerExternalId: seller.email,
  totalAmount: 50000,
  currency: 'NGN',
  milestones: [
    { title: 'Design Mockups',   amount: 20000 },
    { title: 'Final Delivery',   amount: 30000 },
  ],
});

// Returns a Nomba Virtual Account (NUBAN) for the buyer to fund
console.log('Pay to:', agreement.nombaVirtualAccountNo);
console.log('Bank:',   agreement.nombaBank); // "Nomba MFB"
```

---

## SDK Reference

### Constructor

```typescript
new Vouch(apiKey: string, options?: VouchOptions)
```

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | required | Your Vouch API key (`vch_...`) |
| `options.apiUrl` | `string` | `https://vouchsdk.onrender.com` | Override backend base URL |
| `options.verifyUrl` | `string` | `https://vouchsdk-modal.vercel.app` | Override modal host URL |

---

### Identity Verification

#### `vouch.identity.verify(externalUserId)`

Launches the hosted biometric KYC verification modal. Injects a full-screen blurred backdrop with an animated slide-in iframe. The returned promise resolves when the user completes verification.

```typescript
const result: IdentityVerifyResult = await vouch.identity.verify(user.id);
```

**Return type:**

```typescript
interface IdentityVerifyResult {
  status: 'success' | 'failed';
  message: string;
  data: {
    id: string;                       // e.g. "idv_k2x9pq3"
    externalUserId: string;
    identityVerified: boolean;
    identityMatchScore: number | null; // 0–100 face match confidence
    livenessPassed: boolean;
    documentType: string | null;       // "national_id" | "passport" | ...
  };
}
```

**Error handling:**

```typescript
vouch.identity.verify(userId)
  .then((result) => { /* verified */ })
  .catch((err) => {
    if (err?.cancelled) {
      // User dismissed the modal
    } else {
      console.error('Verification failed:', err.message);
    }
  });
```

#### `vouch.identity.submitVerification(documentFile, selfieFrames, externalUserId)`

Headless alternative — use when you have your own camera UI and want to POST raw image data directly.

```typescript
const result = await vouch.identity.submitVerification(
  documentFile,   // File | Blob — photo of government-issued ID
  selfieFrames,   // (File | Blob)[] — up to 25 frames for liveness
  user.id
);
```

---

### Fraud Assessment

#### `vouch.fraud.assess(params)`

Runs a real-time ML fraud risk assessment. Automatically collects device signals via FingerprintJS before posting to the ML engine.

```typescript
const risk: FraudAssessResult = await vouch.fraud.assess({
  platformUserId:          'user@example.com',
  transactionAmount:        50000,
  agreementId:             'agr_abc123',       // optional — ties to an escrow
  simulateVpn:              false,              // test-mode simulation flags
  simulateImpossibleTravel: false,
});
```

**Return type:**

```typescript
interface FraudAssessResult {
  score:            number;                    // 0–100 (higher = more risk)
  flag:             'GREEN' | 'AMBER' | 'RED';
  category:         string;                    // e.g. "DEVICE_ANOMALY"
  triggeredSignals: string[];                  // e.g. ["vpn_detected", "new_device"]
  recommendation:   string;                    // Human-readable action
}
```

---

### Escrow Agreements

#### `vouch.escrow.create(params)`

Creates a milestone-based escrow agreement and provisions a Nomba Virtual Account (a unique NUBAN bank number for the buyer to transfer funds into).

```typescript
const agreement: AgreementResponse = await vouch.escrow.create({
  buyerExternalId:  'buyer@example.com',
  sellerExternalId: 'seller@example.com',
  totalAmount:       100000,
  currency:         'NGN',
  buyerEmail:       'buyer@example.com',
  buyerName:        'John Doe',
  milestones: [
    { title: 'Phase 1: Research',     amount: 40000 },
    { title: 'Phase 2: Development',  amount: 60000 },
  ],
});

console.log('Virtual Account:', agreement.nombaVirtualAccountNo);
console.log('Bank:',            agreement.nombaBank);
console.log('Status:',          agreement.status); // 'PENDING'
```

#### `vouch.escrow.assess(agreementId, params)`

Runs a fraud check scoped to a specific payment event within an escrow agreement.

```typescript
const paymentRisk = await vouch.escrow.assess(agreementId, {
  externalUserId:    'buyer@example.com',
  transactionAmount:  40000,
});
```

#### `vouch.escrow.confirm(agreementId, milestoneId, externalUserId)`

Records party confirmation of a milestone. When both buyer and seller call this, the payout is automatically disbursed via Nomba bank transfer.

```typescript
// Buyer confirms work received
await vouch.escrow.confirm(agreementId, milestoneId, 'buyer@example.com');

// Seller confirms work delivered
await vouch.escrow.confirm(agreementId, milestoneId, 'seller@example.com');
// → Payout automatically disbursed to seller's bank account
```

#### `vouch.escrow.status(agreementId)`

Retrieves the full state of an agreement including all milestones.

```typescript
const agreement = await vouch.escrow.status(agreementId);
console.log(agreement.status);
// 'PENDING' | 'PARTIAL' | 'FUNDED' | 'OVERFUNDED'
// | 'IN_PROGRESS' | 'COMPLETED' | 'DISBURSED' | 'FROZEN' | 'REFUNDED'
```

**Escrow lifecycle:**

```
PENDING ──→ PARTIAL ──→ FUNDED ──→ IN_PROGRESS ──→ COMPLETED ──→ DISBURSED
         ↘                  ↘ OVERFUNDED ↗
                                         ↘ FROZEN ──→ REFUNDED
```

---

## REST API Reference

**Base URL:** `https://vouchsdk.onrender.com`  
**Authentication:** All endpoints require `x-api-key: vch_YOUR_KEY` header.

### Developer

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/developer/signup` | Create developer account; returns API key |
| `POST` | `/developer/login` | Authenticate; retrieve API key |
| `GET` | `/developer/stats` | Dashboard usage stats |
| `GET` | `/developer/logs` | Paginated event audit log |
| `GET` | `/developer/logs/:id` | Single log entry |
| `POST` | `/developer/api-keys` | Generate additional API keys |
| `POST` | `/developer/mark-verified` | _(Test only)_ Mark a user as identity-verified |

### Identity

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/identity/verify` | Submit `multipart/form-data` with `document_image` + up to 25 `selfie_images` |

### Escrow

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/escrow/agreements` | Create escrow agreement |
| `GET` | `/escrow/agreements` | List by user (`?externalUserId=&role=buyer\|seller`) |
| `GET` | `/escrow/agreements/:id` | Get agreement + milestones |
| `GET` | `/escrow/agreements/:id/statement` | Ledger statement |
| `POST` | `/escrow/agreements/:id/assess` | Fraud-assess a payment event |
| `POST` | `/escrow/agreements/:id/milestones/:mid/confirm` | Confirm milestone completion |
| `POST` | `/escrow/agreements/:id/simulate-payment` | _(Test only)_ Simulate a bank transfer |
| `POST` | `/escrow/agreements/:id/refund` | Refund a frozen or overfunded agreement |
| `POST` | `/escrow/webhooks/nomba` | Nomba inbound payment webhook (HMAC-SHA256) |

### Fraud

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/fraud/assess` | ML fraud risk score for a transaction |

---

## AI Engine

The Vouch AI Engine is a Python FastAPI microservice providing the ML backbone for identity verification and fraud detection.

**Base URL:** `https://vouch-2uoc.onrender.com`  
**Swagger UI:** [vouch-2uoc.onrender.com/docs](https://vouch-2uoc.onrender.com/docs)

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/identity/verify` | Face match + document OCR + liveness check |
| `POST` | `/fraud/assess` | XGBoost/LightGBM fraud risk scoring |
| `GET` | `/health` | Service health + endpoint index |

### Identity Verification Request

```
POST /identity/verify
Content-Type: multipart/form-data

Fields:
  document_image   — JPEG/PNG, max 10MB
  selfie_images    — up to 25 JPEG/PNG frames
  platform_user_id — your user's identifier

Response:
{
  "verified": true,
  "match_score": 94.2,
  "liveness_passed": true,
  "document_type": "national_id"
}
```

### ML Stack

| Component | Technology |
|---|---|
| Face verification | DeepFace (ArcFace model) |
| Liveness detection | MediaPipe Face Mesh |
| Document OCR | Tesseract + pytesseract |
| Fraud scoring | XGBoost + LightGBM ensemble |
| Explainability | SHAP values |
| Computer vision | OpenCV headless |
| Feature engineering | scikit-learn pipelines |
| Serving | FastAPI + uvicorn |

---

## Verification Modal

The verification modal (`/modal`) is a standalone Next.js app hosted at [vouchsdk-modal.vercel.app](https://vouchsdk-modal.vercel.app). It is automatically loaded by the SDK — you do not need to build any camera or KYC UI yourself.

### How It Works

When `vouch.identity.verify()` is called, the SDK:

1. Injects a `<style>` tag with fade/slide animations into `document.head`
2. Creates a dark blurred overlay (`position: fixed; z-index: 999999`)
3. Mounts an `<iframe>` loading `vouchsdk-modal.vercel.app/verify?userId=...&key=...&mode=modal`
4. Adds an `×` close button and `Escape` key listener

The modal UI walks the user through four steps:
- **Step 1 — Document Type:** Select ID type (National ID, Passport, Driver's License)
- **Step 2 — Document Capture:** Upload or photograph the document
- **Step 3 — Liveness Selfie:** Multi-frame video capture for anti-spoofing
- **Step 4 — Result:** Pass / fail display with score

On completion, the modal calls `window.parent.postMessage({ source: 'vouch-identity', success: true, result: {...} })`. The SDK's `message` event listener receives this, removes the overlay from the DOM, and resolves the promise.

---

## Demo Application

**Plica** ([vouchsdk-demo.vercel.app](https://vouchsdk-demo.vercel.app)) is a full-stack freelance marketplace that demonstrates all three Vouch primitives working end-to-end.

### Demonstrated Flows

**As a Buyer:**
1. Sign up → access the dashboard
2. Browse the freelancer marketplace
3. Attempt to hire → **blocked** until identity verified
4. Verify identity via the Vouch biometric modal
5. Create an escrow agreement → receive a Nomba NUBAN bank number
6. Confirm milestone delivery → payout auto-disbursed to freelancer

**As a Freelancer:**
1. Sign up → publish gigs to the marketplace
2. Verify identity to show a "Verified" badge
3. Accept escrow agreements from buyers
4. Confirm delivery → receive milestone payout

### Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (via Next.js API routes)
- **Auth:** Session-based (localStorage, demo mode)
- **Payments:** Vouch SDK + Nomba escrow

---

## Environment Variables

### `vouch-backend/.env`

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/vouchdb

# Nomba API
NOMBA_BASE_URL=https://api.nomba.com
NOMBA_CLIENT_ID=your_nomba_client_id
NOMBA_CLIENT_SECRET=your_nomba_client_secret
NOMBA_ACCOUNT_ID=your_nomba_account_id
NOMBA_SUB_ACCOUNT_ID=your_nomba_sub_account_id

# Webhook
NOMBA_WEBHOOK_URL=https://your-domain/escrow/webhooks/nomba
NOMBA_WEBHOOK_SECRET=your_hmac_secret

# AI Engine
AI_ENGINE_URL=https://vouch-2uoc.onrender.com
```

### `vouch-frontend/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_VOUCH_API_URL=https://vouchsdk.onrender.com
```

### `vouch-demo/.env.local`

```env
NEXT_PUBLIC_VOUCH_API_KEY=vch_your_api_key
NEXT_PUBLIC_VOUCH_API_URL=https://vouchsdk.onrender.com
```

---

## Local Development

### Prerequisites

- Node.js `>= 18`
- pnpm `>= 8`
- Python `>= 3.11`
- PostgreSQL or a Supabase project

### SDK

```bash
cd vouch-sdk
npm install
npm run build
```

### Backend API

```bash
cd vouch-backend
npm install
cp .env.example .env    # fill in credentials
npx prisma generate
npx prisma migrate dev
npm run start:dev
# Listening on http://localhost:3001
```

### AI Engine

```bash
cd vouch-ai-engine
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8080 --reload
# API:   http://localhost:8080
# Docs:  http://localhost:8080/docs
```

### Frontend / Dashboard

```bash
cd vouch-frontend
pnpm install
cp .env.example .env.local
pnpm dev
# http://localhost:3000
```

### Verification Modal

```bash
cd modal
pnpm install
pnpm dev
# http://localhost:3002
```

### Demo App

```bash
cd vouch-demo
pnpm install
cp .env.example .env.local
pnpm dev
# http://localhost:3000
```

> **Local SDK override:** Point deployed apps at your local services during development:
> ```typescript
> const vouch = new Vouch('vch_your_key', {
>   apiUrl:    'http://localhost:3001',
>   verifyUrl: 'http://localhost:3002',
> });
> ```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **SDK** | TypeScript, Axios, FingerprintJS |
| **Backend** | NestJS, Prisma ORM, PostgreSQL |
| **AI/ML Engine** | Python, FastAPI, uvicorn |
| **Face Verification** | DeepFace (ArcFace), MediaPipe |
| **Fraud ML** | XGBoost, LightGBM, scikit-learn, SHAP |
| **Payments** | Nomba Virtual Accounts (NUBAN bank rails) |
| **Frontend** | Next.js 16, Tailwind CSS, Framer Motion |
| **Auth** | Supabase (frontend), API key guard (backend) |
| **Database** | PostgreSQL via Supabase |
| **Deployment** | Vercel (frontend, modal, demo) · Render (backend, AI) |
| **Registry** | npm (`vouch-sdk`) |

---

## Contributing

1. **Fork** the repository
2. **Branch:** `git checkout -b feat/your-feature`
3. Make your changes in the relevant module
4. **SDK changes:** bump the version in `vouch-sdk/package.json` then publish:
   ```bash
   cd vouch-sdk
   npm run build
   npm publish
   # Then update dependents
   cd ../vouch-demo && pnpm install
   cd ../modal && pnpm install
   ```
5. **Backend changes:** ensure `npm run build` passes with zero TypeScript errors
6. **AI engine changes:** run `pytest tests/ -v` inside `vouch-ai-engine/`
7. **Commit:** `git commit -m "feat: describe your change"`
8. **Push** and open a pull request

---

## License

MIT © Vouch Team — Built for the **Nomba Hackathon 2026**

---

<div align="center">

[vouch-sdk.vercel.app](https://vouch-sdk.vercel.app) · [npm](https://www.npmjs.com/package/vouch-sdk) · [REST API](https://vouchsdk.onrender.com) · [ML Docs](https://vouch-2uoc.onrender.com/docs) · [Demo](https://vouchsdk-demo.vercel.app)

</div>
