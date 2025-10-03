import { generateJwt } from "@coinbase/cdp-sdk/auth";

interface CDPAuthConfig {
  requestMethod: string;
  requestHost: string;
  requestPath: string;
  audience?: string[];
}

/**
 * Get CDP API credentials from environment variables
 *
 * @throws Error if credentials are not configured
 */
export function getCDPCredentials() {
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    throw new Error("CDP API credentials not configured");
  }

  return { apiKeyId, apiKeySecret };
}

/**
 * Generate JWT token for CDP API authentication
 *
 * @param config - Configuration for JWT generation
 * @returns JWT token string
 */
export async function generateCDPJWT(config: CDPAuthConfig): Promise<string> {
  const { apiKeyId, apiKeySecret } = getCDPCredentials();

  return generateJwt({
    apiKeyId,
    apiKeySecret,
    requestMethod: config.requestMethod,
    requestHost: config.requestHost,
    requestPath: config.requestPath,
  });
}

/**
 * Base URL for ONRAMP API
 * Can change to api.cdp.coinbase.com/platform once session token endpoints are supported in v2 API
 */
export const ONRAMP_API_BASE_URL = "https://api.developer.coinbase.com";
