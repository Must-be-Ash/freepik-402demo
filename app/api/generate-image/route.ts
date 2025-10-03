import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// This route would normally integrate with x402 payment middleware
// For this demo, we'll simulate the payment check and call Freepik directly

export async function POST(request: NextRequest) {
  try {
    // In a real x402 integration, this would:
    // 1. Check for X-PAYMENT header
    // 2. Validate payment with facilitator
    // 3. Only proceed if payment is valid

    const body = await request.json();
    const { prompt, model, resolution, aspect_ratio, creative_detailing, engine, fixed_generation, filter_nsfw } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Check for Freepik API key
    const freepikApiKey = process.env.FREEPIK_API_KEY;
    if (!freepikApiKey) {
      return NextResponse.json(
        { error: 'Freepik API key not configured' },
        { status: 500 }
      );
    }

    // Check for x402 payment header
    const paymentHeader = request.headers.get('X-PAYMENT');

    // Always call Freepik's x402 endpoint - it will handle the 402 flow
    // If no payment, Freepik returns 402 with their requirements
    // If payment provided, Freepik processes it and returns the image

    // Log the payment header if present (for debugging)
    if (paymentHeader) {
      console.log('Payment header received, forwarding to Freepik');
      console.log('X-PAYMENT header (first 200 chars):', paymentHeader.substring(0, 200));
      // Decode and log the payment details
      try {
        const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
        console.log('Decoded payment:', JSON.stringify(decoded, null, 2));

        // Additional checks for debugging settlement failure
        console.log('═══ PAYMENT VALIDATION ═══');
        console.log('x402 Version:', decoded.x402Version);
        console.log('Payment Scheme:', decoded.scheme);
        console.log('Network:', decoded.network);
        console.log('From Address:', decoded.payload?.authorization?.from);
        console.log('To Address (Recipient):', decoded.payload?.authorization?.to);
        console.log('Payment Value:', decoded.payload?.authorization?.value, 'units');
        console.log('Payment Value (USDC):', (parseInt(decoded.payload?.authorization?.value) / 1e6).toFixed(6), 'USDC');
        console.log('Payment Nonce:', decoded.payload?.authorization?.nonce);
        console.log('Valid After:', decoded.payload?.authorization?.validAfter, '(', new Date(parseInt(decoded.payload?.authorization?.validAfter) * 1000).toISOString(), ')');
        console.log('Valid Before:', decoded.payload?.authorization?.validBefore, '(', new Date(parseInt(decoded.payload?.authorization?.validBefore) * 1000).toISOString(), ')');
        console.log('Current Time:', Math.floor(Date.now() / 1000), '(', new Date().toISOString(), ')');
        console.log('Signature:', decoded.payload?.signature);

        // Validate network matches env
        const expectedNetwork = process.env.NEXT_PUBLIC_NETWORK || 'base';
        if (decoded.network !== expectedNetwork) {
          console.warn(`⚠️  WARNING: Payment network (${decoded.network}) doesn't match expected network (${expectedNetwork})`);
        }

        // Check if USDC contract address is available in the decoded payment
        // Note: The asset address might be in the original 402 response, not in the payment itself
        const expectedUSDC = process.env.USDC_CONTRACT_ADDRESS;
        console.log('Expected USDC Contract:', expectedUSDC);
        console.log('═══ END PAYMENT VALIDATION ═══');
      } catch (e) {
        console.log('Could not decode payment header as base64 JSON');
      }
    } else {
      console.log('No payment header, Freepik will return 402');
    }

    // Call Freepik's x402 endpoint - this will handle the 402 payment flow
    // No webhook needed since x402 endpoint is synchronous
    const freepikHeaders: any = {
      'Content-Type': 'application/json',
      'x-freepik-api-key': freepikApiKey,
    };
    
    // Forward the X-PAYMENT header if provided
    if (paymentHeader) {
      freepikHeaders['X-PAYMENT'] = paymentHeader;
    }

    // Construct webhook URL for Freepik to notify us when image is ready
    // Use environment variable if set, otherwise auto-detect from request
    let webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      // Auto-detect from request host
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      webhookUrl = `${protocol}://${host}/api/webhooks/freepik`;
    }

    console.log('Webhook URL:', webhookUrl);
    if (process.env.NODE_ENV !== 'production' && !process.env.WEBHOOK_URL) {
      console.log('⚠️  WARNING: In development, webhook URL must be publicly accessible!');
      console.log('   Set WEBHOOK_URL env var to your ngrok URL, or Freepik cannot send webhooks.');
      console.log('   Example: WEBHOOK_URL=https://abc123.ngrok.io/api/webhooks/freepik');
    }

    // Call Freepik's x402 endpoint with proper error handling
    let freepikResponse;
    try {
      freepikResponse = await axios.post(
        'https://api.freepik.com/v1/x402/ai/mystic',
        {
          prompt,
          model,
          resolution,
          aspect_ratio,
          creative_detailing,
          engine,
          fixed_generation,
          filter_nsfw,
          webhook_url: webhookUrl, // Required for async image generation completion notification
        },
        {
          headers: freepikHeaders,
          validateStatus: (status) => status === 200 || status === 402 || status === 500, // Accept success, payment required, and server errors to capture details
        }
      );
    } catch (verificationError: any) {
      // Log detailed error information similar to Freepik's backend pattern
      console.error('═══ FACILITATOR VERIFICATION ERROR ═══');
      console.error('Failed to verify payment with Freepik facilitator');
      console.error('Error type:', verificationError?.name || typeof verificationError);
      console.error('Error message:', verificationError?.message || String(verificationError));
      console.error('Facilitator URL:', 'https://api.freepik.com/v1/x402/ai/mystic');

      // Log network/connection errors
      if (verificationError?.code) {
        console.error('Error code:', verificationError.code);
      }

      // Log if this is a timeout
      if (verificationError?.code === 'ECONNABORTED' || verificationError?.message?.includes('timeout')) {
        console.error('⚠️  This appears to be a timeout error');
      }

      // Log the stack trace for debugging
      if (verificationError?.stack) {
        console.error('Stack trace:', verificationError.stack);
      }

      console.error('═══ END FACILITATOR ERROR ═══');

      return NextResponse.json(
        {
          error: 'Facilitator verification failed',
          message: `Payment verification failed: ${verificationError?.message || 'Unknown error'}`,
          errorType: verificationError?.name || 'UnknownError',
          facilitatorUrl: 'https://api.freepik.com/v1/x402/ai/mystic'
        },
        { status: 500 }
      );
    }

    // Handle Freepik's response
    if (freepikResponse.status === 402) {
      // Check if this is an initial 402 (no payment) or a payment verification failure
      const is_verification_failure = freepikResponse.data.error &&
                                      freepikResponse.data.error.toLowerCase().includes('verification');

      if (is_verification_failure) {
        // This is a payment verification failure - log detailed information
        console.error('═══ PAYMENT VERIFICATION FAILED ═══');
        console.error('Freepik rejected the payment:');
        console.error('Error:', freepikResponse.data.error);
        console.error('Network:', freepikResponse.data.accepts?.[0]?.network);
        console.error('Expected asset:', freepikResponse.data.accepts?.[0]?.asset);
        console.error('Expected recipient:', freepikResponse.data.accepts?.[0]?.payTo);
        console.error('Max amount:', freepikResponse.data.accepts?.[0]?.maxAmountRequired);

        // Log what we sent
        if (paymentHeader) {
          try {
            const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
            console.error('Payment we sent:');
            console.error('  Network:', decoded.network);
            console.error('  From:', decoded.payload?.authorization?.from);
            console.error('  To:', decoded.payload?.authorization?.to);
            console.error('  Value:', decoded.payload?.authorization?.value);
          } catch (e) {
            console.error('Could not decode sent payment for comparison');
          }
        }
        console.error('═══ END VERIFICATION FAILURE ═══');
      } else {
        // This is an initial 402 - no payment was provided
        console.log('Freepik returned 402 Payment Required:', freepikResponse.data);
        console.log('Payment requirements extra field:', freepikResponse.data.accepts?.[0]?.extra);
      }

      return NextResponse.json(
        freepikResponse.data,
        {
          status: 402,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else if (freepikResponse.status === 200) {
      // Freepik returned the generated image - forward it to frontend
      console.log('Freepik returned generated image');
      console.log('Full Freepik response:', {
        status: freepikResponse.status,
        headers: freepikResponse.headers,
        data: freepikResponse.data
      });
      console.log('Response data structure:', JSON.stringify(freepikResponse.data, null, 2));

      // Check for and log X-PAYMENT-RESPONSE header (transaction confirmation)
      const paymentResponseHeader = freepikResponse.headers['x-payment-response'];
      if (paymentResponseHeader) {
        console.log('═══ PAYMENT CONFIRMATION ═══');
        console.log('Raw X-PAYMENT-RESPONSE header:', paymentResponseHeader);

        // Decode the payment response (it's base64 encoded JSON)
        try {
          const decoded = JSON.parse(Buffer.from(paymentResponseHeader, 'base64').toString());
          console.log('Decoded payment response:', JSON.stringify(decoded, null, 2));

          if (decoded.transaction) {
            console.log('✅ Payment transaction hash:', decoded.transaction);
            console.log('View on Base scan:', `https://basescan.org/tx/${decoded.transaction}`);
          }
        } catch (e) {
          console.error('Could not decode X-PAYMENT-RESPONSE:', e);
        }

        console.log('═══ END PAYMENT CONFIRMATION ═══');
      } else {
        console.log('Note: No X-PAYMENT-RESPONSE header (payment may not have been required)');
      }

      const response = NextResponse.json(freepikResponse.data);

      // Forward the X-PAYMENT-RESPONSE header to client
      if (paymentResponseHeader) {
        response.headers.set('X-PAYMENT-RESPONSE', paymentResponseHeader);
        response.headers.set('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE');
      }

      return response;
    } else if (freepikResponse.status === 500) {
      // Freepik returned a server error - log full details and forward to client
      console.error('═══ FREEPIK 500 ERROR DETAILS ═══');
      console.error('Status:', freepikResponse.status);
      console.error('Status Text:', freepikResponse.statusText);
      console.error('Response Headers:', JSON.stringify(freepikResponse.headers, null, 2));
      console.error('Response Data:', freepikResponse.data);
      console.error('Response Data Type:', typeof freepikResponse.data);

      // Try to parse HTML error if present
      let errorPageTitle = null;
      if (typeof freepikResponse.data === 'string' && freepikResponse.data.includes('<!DOCTYPE html>')) {
        console.error('Freepik returned HTML error page (likely internal server error)');
        // Extract title if possible
        const titleMatch = freepikResponse.data.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          errorPageTitle = titleMatch[1];
          console.error('Error page title:', errorPageTitle);
        }
      }

      // Log potential causes
      console.error('Potential causes:');
      console.error('  - Payment settlement verification failed on Freepik backend');
      console.error('  - Freepik facilitator service returned empty/invalid response');
      console.error('  - Network not supported (mainnet vs testnet mismatch)');
      console.error('  - Upstream service failure (check x-apisix-upstream-status header)');

      // Log diagnostic info
      if (paymentHeader) {
        console.error('Payment was provided - this is likely a settlement/verification issue');
        try {
          const decoded = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
          console.error('Payment network:', decoded.network);
          console.error('Check if Freepik supports this network for x402 payments');
        } catch (e) {
          // Ignore decode errors
        }
      }

      console.error('═══ END FREEPIK ERROR ═══');

      return NextResponse.json(
        {
          error: 'Freepik server error',
          message: 'Freepik API returned 500 Internal Server Error. This is likely a payment settlement issue on their end.',
          status: 500,
          details: errorPageTitle || (typeof freepikResponse.data === 'string' ? 'HTML error page' : freepikResponse.data),
          diagnostics: {
            hasPayment: !!paymentHeader,
            upstreamStatus: freepikResponse.headers['x-apisix-upstream-status'],
            requestId: freepikResponse.headers['x-request-id'],
            suggestedAction: 'Contact Freepik support with the request ID if this persists'
          }
        },
        { status: 500 }
      );
    } else {
      // Unexpected response from Freepik
      console.error('Unexpected response from Freepik:', freepikResponse.status, freepikResponse.data);
      return NextResponse.json(
        { error: 'Unexpected response from Freepik', status: freepikResponse.status },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Image generation error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message;
      
      return NextResponse.json(
        { 
          error: 'Freepik API error',
          message: message,
          status: status
        },
        { status: status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate image', message: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}