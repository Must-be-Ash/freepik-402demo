# Freepik x402 Image Generator

This app brings together the **x402 Protocol**, **Coinbase Developer Platform's Embedded Wallet**, **Onramp**, and **Freepik's AI Image Generator** to demonstrate a new type of pay-per-use business model. By enabling micropayments with stablecoins through x402, it creates a digital product that's affordable for customers, profitable for service providers, and sustainable for platforms. Customers pay only for what they use with no commitments. Platforms don't spend upfront to access the service provider. It's a win-win scenario for all three parties.

Users don't need any crypto experience. With **Embedded Wallet**, they simply log in with email and a wallet is created for them automatically. **Onramp** lets them top up using Apple Pay (US only) or credit card without KYC. This abstracts away all crypto complexity and puts everything under the hood. Using **x402 Protocol**, users pay $0.08 to generate images with one click—no wallet signatures required.

With x402's low transaction fees, Freepik's AI suite accessible through x402, and **Embedded Wallet**, and **Onramp** removing crypto UX friction, a new type of digital product becomes possible. One where customers don't overpay, and platforms and service providers don't lose on costs, transaction fees, upfront expenses, or subsidizing usage.

## What This App Does

Generate AI-powered images using Freepik's Mystic AI, with automatic crypto payments via the x402 protocol. No manual payment handling required - the `x402-fetch` library intercepts 402 responses and handles payment authorization automatically.

## Architecture Overview

### Frontend Components

- **`app/page.tsx`** - Main page with password protection
- **`components/ClientApp.tsx`** - Handles Coinbase wallet connection state
- **`components/SignInScreen.tsx`** - Coinbase wallet connection UI
- **`components/SignedInScreen.tsx`** - Main app container after wallet connection
- **`components/ImageGenerator.tsx`** - Image generation form and payment flow
  - Uses `x402-fetch` to wrap standard `fetch()` with automatic payment handling
  - Integrates with Coinbase CDP SDK for wallet operations
  - Polls task status endpoint for completion

### Backend API Routes

- **`app/api/generate-image/route.ts`** - Main image generation endpoint
  - Forwards requests to Freepik's x402 API
  - Handles payment validation and logging
  - Includes webhook URL for async completion

- **`app/api/task-status/route.ts`** - Task polling endpoint
  - Checks generation status by task_id
  - Returns generated image URLs when complete

- **`app/api/webhooks/freepik/route.ts`** - Webhook receiver
  - Receives completed image notifications from Freepik
  - Validates webhook signatures
  - Stores results in memory for retrieval

### Libraries & Utilities

- **`lib/config.ts`** - CDP and app configuration
- **`lib/task-store.ts`** - In-memory task result storage
- **`lib/webhook-security.ts`** - Webhook signature validation
- **`components/Providers.tsx`** - Coinbase CDP React context provider

## How It Works

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ 1. User submits prompt
       ▼
┌─────────────────────────────┐
│   ImageGenerator.tsx        │
│  - Wraps fetch() with       │
│    x402-fetch               │
│  - CDP wallet signs payment │
└──────┬──────────────────────┘
       │ 2. POST /api/generate-image
       ▼
┌─────────────────────────────┐
│ /api/generate-image/route   │
│  - Forwards to Freepik      │
│  - Includes webhook URL     │
└──────┬──────────────────────┘
       │ 3. POST to Freepik x402 API
       ▼
┌─────────────────────────────┐
│   Freepik API               │
│  - Returns 402 if no payment│
│  - x402-fetch auto-pays     │
│  - Returns task_id          │
└──────┬──────────────────────┘
       │ 4. Async generation (30-60s)
       ▼
┌─────────────────────────────┐
│   Freepik Backend           │
│  - Generates image          │
│  - POSTs to webhook URL     │
└──────┬──────────────────────┘
       │ 5. Webhook callback
       ▼
┌─────────────────────────────┐
│ /api/webhooks/freepik       │
│  - Stores result            │
│  - Validates signature      │
└─────────────────────────────┘
       │
       │ 6. Frontend polls /api/task-status
       ▼
┌─────────────────────────────┐
│   User sees image           │
└─────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- Freepik API key ([Get one here](https://www.freepik.com/api))
- Coinbase Developer Platform account for CDP SDK
- USDC on Base network for payments (mainnet) or Base Sepolia (testnet)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   ```

3. **Set required environment variables in `.env.local`:**
   ```env
   # Freepik
   FREEPIK_API_KEY=your-freepik-api-key

   # Network (base for mainnet, base-sepolia for testnet)
   NEXT_PUBLIC_NETWORK=base

   # Coinbase Developer Platform
   NEXT_PUBLIC_CDP_PROJECT_ID=your-cdp-project-id
   CDP_API_KEY_ID=your-cdp-api-key-id
   CDP_API_KEY_SECRET=your-cdp-api-key-secret

   # USDC Contract
   USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

   # Webhook (for development, use ngrok or webhook.site)
   WEBHOOK_URL=https://webhook.site/your-unique-id
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Webhook Setup for Development

Freepik needs to send completion notifications to your webhook. In development:

**Option 1: Use webhook.site (easiest)**
```bash
# Visit https://webhook.site
# Copy your unique URL
# Set in .env.local:
WEBHOOK_URL=https://webhook.site/your-unique-id
```

**Option 2: Use ngrok**
```bash
# Install ngrok
brew install ngrok

# Start ngrok (in separate terminal)
ngrok http 3000

# Set in .env.local:
WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/freepik
```

## Configuration

### Networks

**Base Mainnet (Production):**
```env
NEXT_PUBLIC_NETWORK=base
USDC_CONTRACT_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

**Base Sepolia (Testnet):**
```env
NEXT_PUBLIC_NETWORK=base-sepolia
USDC_CONTRACT_ADDRESS=0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Image Generation Options

- **Resolution**: 1k, 2k, 4k
- **Aspect Ratio**: square (1:1), widescreen (16:9), portrait (3:4), landscape (4:3)
- **Model**: realism, fluid, zen
- **Creative Detailing**: 0-100 (controls level of detail)

## Key Technologies

- **Next.js 14** - React framework with App Router
- **x402-fetch** - Automatic HTTP payment handling
- **Coinbase CDP SDK** - Wallet creation and management
- **Freepik Mystic AI** - Image generation
- **Base Network** - Ethereum L2 for low-cost USDC payments
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

## Payment Flow Details

1. User submits image prompt
2. `x402-fetch` wraps the request to `/api/generate-image`
3. First attempt returns 402 with payment requirements
4. `x402-fetch` automatically:
   - Reads payment requirements from response
   - Signs EIP-3009 authorization with CDP wallet
   - Retries request with `X-PAYMENT` header
5. Server validates payment and forwards to Freepik
6. Freepik returns task_id immediately
7. Image generates asynchronously (~30-60 seconds)
8. Freepik sends completion webhook with image URL
9. Frontend polls task status until complete

## Project Structure

```
freepik/
├── app/
│   ├── api/
│   │   ├── generate-image/route.ts    # Main API: forwards to Freepik
│   │   ├── task-status/route.ts       # Polls generation status
│   │   └── webhooks/freepik/route.ts  # Receives completion callbacks
│   ├── layout.tsx                     # Root layout with CDP provider
│   └── page.tsx                       # Main page with password gate
├── components/
│   ├── ImageGenerator.tsx             # Image gen form + x402 payment
│   ├── ClientApp.tsx                  # Wallet connection logic
│   ├── SignInScreen.tsx               # Wallet connect UI
│   ├── SignedInScreen.tsx             # Main app after connect
│   └── Providers.tsx                  # CDP React provider setup
├── lib/
│   ├── config.ts                      # App configuration
│   ├── task-store.ts                  # In-memory task storage
│   └── webhook-security.ts            # Webhook signature validation
└── .env.local                         # Environment variables
```

## Troubleshooting

### "Payment verification failed"
- **Mainnet not supported yet**: Currently, Freepik's x402 API only works reliably on Base Sepolia testnet
- Switch to testnet configuration in `.env.local`

### "No payment header provided"
- CDP wallet not properly initialized
- Check that `NEXT_PUBLIC_CDP_PROJECT_ID` and related keys are set
- Ensure wallet is connected (check browser console)

### "Webhook not receiving callbacks"
- Webhook URL must be publicly accessible
- If using localhost, set up ngrok or webhook.site
- Verify `WEBHOOK_URL` in `.env.local`
- Check Freepik didn't return 500 error (check server logs)

### Payment goes through but no image
- Check webhook is receiving callbacks (monitor webhook.site or server logs)
- Verify webhook URL is publicly accessible
- Check task status manually: `/api/task-status?task_id=your-task-id`

## Development

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Learn More

- [x402 Protocol Documentation](https://docs.x402.org)
- [Coinbase Developer Platform](https://docs.cdp.coinbase.com)
- [Freepik API Documentation](https://docs.freepik.com)
- [Base Network](https://base.org)

## License

MIT

---

**Note**: This project demonstrates x402 HTTP payment integration. The implementation handles payment authorization client-side using CDP wallets and EIP-3009 token authorizations.
