# Freepik 402 Demo

A minimal demonstration of integrating Freepik's AI image generation API with the x402 payment system, requiring crypto payments before accessing the image generation service.

## Overview

This project creates a payment-gated API that wraps Freepik's Mystic AI image generation endpoint. Users must pay in USDC via crypto wallets to access the image generation service.

## Features

- 🔐 **Payment-gated API**: Crypto payments required before API access
- 🎨 **AI Image Generation**: Powered by Freepik's Mystic AI
- 💳 **Multiple Networks**: Support for Base testnet and mainnet
- 🚀 **Easy Integration**: Simple Express.js server with TypeScript
- 📊 **Task Tracking**: Check generation status with separate endpoint

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- A crypto wallet (for receiving payments)
- Freepik API key ([Get one here](https://www.freepik.com/api))
- Some testnet tokens for testing (Base Sepolia USDC)

### Installation

1. **Clone and setup**:
   ```bash
   cd freepik
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Required environment variables**:
   ```env
   FREEPIK_API_KEY=your-freepik-api-key-here
   WALLET_ADDRESS=0xYourWalletAddressHere
   FACILITATOR_URL=https://x402.org/facilitator
   NETWORK=base-sepolia
   PORT=3000
   ```

4. **Start the server**:
   ```bash
   npm run dev
   ```

## API Endpoints

### Free Endpoints

- `GET /` - Service information
- `GET /health` - Health check

### Paid Endpoints (Require Crypto Payment)

- `POST /v1/x402/ai/mystic` - Generate image (**$0.02 USDC**)
- `GET /v1/x402/ai/mystic/:taskId` - Get task status (**$0.001 USDC**)

## Usage Examples

### 1. Basic Image Generation

```bash
# First request will return 402 Payment Required
curl -X POST http://localhost:3000/v1/x402/ai/mystic \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "resolution": "2k",
    "aspect_ratio": "widescreen_16_9"
  }'
```

Response (402 Payment Required):
```json
{
  "error": "Payment Required",
  "payment": {
    "amount": "$0.02",
    "network": "base-sepolia",
    "to": "0xYourWalletAddress",
    "instructions": "..."
  }
}
```

### 2. Making Payment and Retrying

After completing the crypto payment (using a compatible wallet or x402 client), retry with the payment proof:

```bash
curl -X POST http://localhost:3000/v1/x402/ai/mystic \\
  -H "Content-Type: application/json" \\
  -H "X-PAYMENT: your-payment-proof-here" \\
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "resolution": "2k",
    "aspect_ratio": "widescreen_16_9"
  }'
```

Success Response:
```json
{
  "data": {
    "task_id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
    "status": "IN_PROGRESS",
    "generated": []
  }
}
```

### 3. Check Task Status

```bash
curl -H "X-PAYMENT: your-payment-proof-here" \\
  http://localhost:3000/v1/x402/ai/mystic/046b6c7f-0b8a-43b9-b35d-6489e6daee91
```

## Payment Flow

1. **Initial Request**: Client makes API request
2. **402 Response**: Server responds with payment requirements
3. **Payment**: Client pays required amount in USDC to specified wallet
4. **Retry with Proof**: Client includes payment proof in `X-PAYMENT` header
5. **Success**: Server validates payment and processes request

## Supported Parameters

The `/v1/x402/ai/mystic` endpoint supports all Freepik Mystic parameters:

- `prompt` (required): Text description of the image
- `resolution`: "1k", "2k", or "4k"
- `aspect_ratio`: Various ratios including "square_1_1", "widescreen_16_9"
- `model`: "realism", "fluid", or "zen"
- `creative_detailing`: 0-100 (detail level)
- `engine`: AI engine selection
- And more... (see [Freepik API docs](https://docs.freepik.com/api-reference/mystic/post-mystic))

## Network Configuration

### Testnet (Default)
- Network: `base-sepolia`
- Facilitator: `https://x402.org/facilitator`
- Currency: Testnet USDC

### Mainnet
- Network: `base`
- Facilitator: `https://api.x402.org/facilitator`
- Currency: Real USDC

To switch to mainnet, update your `.env`:
```env
NETWORK=base
FACILITATOR_URL=https://api.x402.org/facilitator
```

## Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run format` - Format code with Prettier
- `npm run lint` - Lint code with ESLint

### Project Structure

```
src/
├── index.ts              # Main Express server
├── freepik-client.ts     # Freepik API wrapper
└── types.ts              # TypeScript interfaces
```

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure all required variables are set in `.env`
   - Check that your wallet address starts with `0x`

2. **Payment Not Working**
   - Verify you have testnet USDC in your wallet
   - Check that the wallet address in `.env` matches your receiving wallet
   - Ensure you're on the correct network (base-sepolia for testnet)

3. **Freepik API Errors**
   - Verify your Freepik API key is valid and active
   - Check API rate limits and quotas
   - Review the Freepik API documentation for parameter requirements

### Getting Help

- [x402 Documentation](https://docs.x402.org)
- [Freepik API Documentation](https://docs.freepik.com)
- [x402 Discord](https://discord.gg/x402)

## License

MIT

---

*This is a demonstration project showing how to integrate crypto payments with existing APIs using the x402 protocol.*# freepik-402
# freepik-402demo
