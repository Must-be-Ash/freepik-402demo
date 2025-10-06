# Freepik x402 Image Generator

## Overview

This application demonstrates a pay-per-use business model for AI image generation by integrating:
- **x402 Protocol** - Enables HTTP 402 payment-required responses with automatic crypto payment handling
- **Coinbase Developer Platform (CDP)** - Provides embedded wallets and onramp functionality for seamless crypto onboarding
- **Freepik Mystic AI** - AI-powered image generation service
- **Next.js 14** - React framework with App Router

Users generate AI images for $0.08 USDC without needing crypto experience. The embedded wallet is created automatically on email login, and Apple Pay integration (US only) allows easy fiat-to-crypto conversion. The `x402-fetch` library intercepts 402 payment-required responses and handles payments automatically.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 3, 2025 - Vercel to Replit Migration**
- Migrated Next.js application from Vercel to Replit environment
- Updated package.json scripts to bind to 0.0.0.0:5000 for Replit compatibility
- Modified next.config.js to use `remotePatterns` instead of deprecated `domains` for image configuration
- Added `allowedDevOrigins: ['*']` to next.config.js to allow Replit's proxy architecture
- Updated Next.js from 14.2.5 to 14.2.33 for security patches
- Configured environment secrets in Replit: FREEPIK_API_KEY, FREEPIK_WEBHOOK_SECRET, NEXT_PUBLIC_CDP_PROJECT_ID, CDP_API_KEY_ID, CDP_API_KEY_SECRET
- Set up development workflow to run on port 5000 (Replit's accessible port)
- Application successfully boots and serves pages without critical errors

## System Architecture

### Frontend Architecture

**Component Hierarchy:**
- `app/page.tsx` - Root page wrapping the app in CDP providers
- `ClientApp.tsx` - Routes between signed-in and signed-out states based on wallet connection
- `SignInScreen.tsx` - Landing page with Coinbase auth button for wallet creation/connection
- `SignedInScreen.tsx` - Authenticated container showing wallet info and funding options
- `ImageGenerator.tsx` - Main image generation interface with prompt input and payment flow

**State Management:**
- Uses Coinbase CDP React hooks (`useIsSignedIn`, `useEvmAddress`, `useIsInitialized`) for wallet state
- Local component state with React hooks for UI state (loading, errors, results)
- No global state management library - relying on CDP provider context

**Payment Flow Integration:**
- `x402-fetch` library wraps standard `fetch()` calls
- When API returns 402 Payment Required, library automatically:
  1. Extracts payment requirements from response headers
  2. Prompts user for payment approval via CDP SDK
  3. Constructs and signs payment transaction
  4. Retries original request with payment proof in `X-PAYMENT` header
- Uses Viem wallet client for transaction signing on Base/Base Sepolia networks

**Design Pattern:**
The app uses an async polling pattern for image generation. After payment, the backend returns a `task_id`, and the frontend polls `/api/task-status` every 2 seconds until the image is ready. This pattern was chosen because Freepik's AI generation is asynchronous and takes 10-30 seconds.

### Backend Architecture

**API Route Structure (Next.js App Router):**

1. **`/api/generate-image`** - Main generation endpoint
   - Accepts image generation parameters (prompt, model, resolution, aspect_ratio)
   - Forwards requests to Freepik's x402-enabled API endpoint
   - If no `X-PAYMENT` header: Freepik returns 402 with payment requirements
   - If valid `X-PAYMENT` header: Freepik processes payment and initiates generation
   - Returns `task_id` for status polling

2. **`/api/task-status`** - Polling endpoint
   - Accepts `task_id` query parameter
   - Queries Freepik API for generation status
   - Returns status and image URLs when complete

3. **`/api/webhooks/freepik`** - Webhook receiver (optional optimization)
   - Receives notifications when image generation completes
   - Validates webhook signatures using HMAC-SHA256
   - Stores results in in-memory map for instant retrieval
   - Reduces polling overhead but polling provides fallback

4. **`/api/onramp/buy-options`** - Fetches available onramp options
   - Returns payment methods and purchasable assets for user's country
   - Authenticated with CDP API via JWT

5. **`/api/onramp/buy-quote`** - Creates purchase quotes
   - Generates quotes for fiat-to-crypto conversion
   - Returns fees and onramp redirect URL

**Authentication Pattern:**
Backend routes use CDP API key authentication via JWT tokens. The `generateCDPJWT()` helper creates signed JWTs for each API request using `@coinbase/cdp-sdk/auth`. This pattern was chosen over OAuth because server-to-server API calls don't need user delegation.

**Data Storage:**
Currently uses in-memory Map for webhook results (`lib/task-store.ts`). This is intentionally simple for the demo but should be replaced with a database (Redis, Postgres, etc.) in production for persistence and scalability.

### Payment Protocol Integration

**x402 Protocol Flow:**
1. Client makes standard fetch request to `/api/generate-image`
2. Backend forwards to Freepik's x402 endpoint without payment
3. Freepik returns 402 with payment requirements in headers:
   - `x402-price` - Amount in USDC (e.g., "0.02")
   - `x402-accept-chain` - Blockchain network (Base/Base Sepolia)
   - `x402-payee-address` - Recipient wallet address
4. `x402-fetch` intercepts 402, prompts user, creates payment transaction
5. User approves in Coinbase wallet UI
6. Library retries request with base64-encoded payment proof in `X-PAYMENT` header
7. Freepik validates payment and processes request

**Why x402 over traditional payments:**
- Sub-cent transactions viable (traditional payment processors have minimum fees)
- No merchant account or payment gateway integration needed
- Instant settlement without chargebacks
- User pays exact API cost with no markup

### Webhook Security

**Signature Verification:**
Freepik webhooks include three security headers:
- `webhook-id` - Unique identifier preventing replay attacks
- `webhook-timestamp` - Ensures recency (validates within 5-minute window)
- `webhook-signature` - HMAC-SHA256 signature for authenticity

The signature is generated from: `webhook-id.webhook-timestamp.request_body` using a shared secret. The `verifyWebhookSignature()` function reconstructs this signature and compares against the header value. This ensures webhooks originate from Freepik and haven't been tampered with.

## External Dependencies

### Third-Party Services

**Coinbase Developer Platform (CDP)**
- **Purpose:** Embedded wallet infrastructure and onramp integration
- **Authentication:** API key + secret (JWT-based server-to-server auth)
- **Components Used:**
  - Embedded Wallet SDK - Automatic wallet creation on email login
  - Onramp API - Fiat-to-crypto conversion (Apple Pay, card, bank transfer)
  - CDP Hooks (`@coinbase/cdp-hooks`) - React state management for wallet
  - CDP React (`@coinbase/cdp-react`) - Pre-built UI components (AuthButton, FundModal)
- **Networks:** Base and Base Sepolia (L2 networks with low gas fees)
- **Configuration:** Requires `CDP_PROJECT_ID`, `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`

**Freepik AI API**
- **Purpose:** AI image generation via Mystic model
- **Authentication:** API key in `x-freepik-api-key` header
- **Endpoints Used:**
  - `POST /v1/ai/mystic` - Start generation task
  - `GET /v1/ai/mystic/{task_id}` - Check task status
  - Webhook receiver for completion notifications
- **Payment:** Integrated with x402 protocol for per-request billing
- **Configuration:** Requires `FREEPIK_API_KEY` and optionally `FREEPIK_WEBHOOK_SECRET`

**x402 Protocol**
- **Library:** `x402-fetch` npm package
- **Purpose:** Wraps fetch() to handle HTTP 402 payment flows automatically
- **Integration:** Used in `ImageGenerator.tsx` with `wrapFetchWithPayment()`
- **Payment Token:** USDC on Base/Base Sepolia
- **Transaction Signing:** Uses Viem wallet client created from CDP SDK

### Blockchain Infrastructure

**Networks:**
- **Base Mainnet** - Production Ethereum L2
- **Base Sepolia** - Testnet for development
- Both chosen for low transaction fees (essential for micro-payments)

**Smart Contract Interactions:**
- USDC token transfers for image generation payments
- All transactions signed client-side via CDP embedded wallet
- No custom smart contracts deployed

### UI Libraries

- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animation library for shimmer effects
- **Next.js Image** - Optimized image component for generated results
- Custom UI components: `ModernButton`, `TextShimmer`, `DotPattern`

### Development Tools

- **TypeScript** - Type safety across frontend and backend
- **ESLint** - Code linting with Next.js config
- **Viem** - Ethereum library for wallet client creation and transaction handling
- **Axios** - HTTP client for backend API calls to Freepik