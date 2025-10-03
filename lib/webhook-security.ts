import crypto from 'crypto';

/**
 * Verifies Freepik webhook signature using HMAC-SHA256
 * Based on Freepik webhook security documentation
 */
export function verifyWebhookSignature(
  webhookId: string,
  webhookTimestamp: string,
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Generate the string to sign: webhook-id.webhook-timestamp.body
    const contentToSign = `${webhookId}.${webhookTimestamp}.${body}`;
    
    // Generate HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(contentToSign, 'utf8')
      .digest('base64');
    
    // The webhook-signature header may contain multiple signatures with versions
    // Format: "v1,signature1 v2,signature2"
    const signatures = signature.split(' ');
    
    // Check each signature
    for (const sig of signatures) {
      const [version, sigValue] = sig.split(',');
      
      // For now, we only support v1
      if (version === 'v1' && sigValue === expectedSignature) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Validates webhook timestamp to prevent replay attacks
 * Ensures the webhook was sent within the last 5 minutes
 */
export function validateWebhookTimestamp(timestamp: string): boolean {
  try {
    const webhookTime = parseInt(timestamp) * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Check if webhook is within 5 minutes
    return Math.abs(currentTime - webhookTime) <= fiveMinutes;
  } catch (error) {
    console.error('Webhook timestamp validation error:', error);
    return false;
  }
}

/**
 * Complete webhook security validation
 * Verifies both signature and timestamp
 */
export function validateWebhook(
  webhookId: string,
  webhookTimestamp: string,
  webhookSignature: string,
  body: string,
  secret: string
): { valid: boolean; error?: string } {
  // Validate timestamp first
  if (!validateWebhookTimestamp(webhookTimestamp)) {
    return { valid: false, error: 'Webhook timestamp is too old or invalid' };
  }
  
  // Verify signature
  if (!verifyWebhookSignature(webhookId, webhookTimestamp, body, webhookSignature, secret)) {
    return { valid: false, error: 'Webhook signature verification failed' };
  }
  
  return { valid: true };
}