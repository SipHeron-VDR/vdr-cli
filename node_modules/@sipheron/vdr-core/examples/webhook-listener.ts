/**
 * Webhook Listener Example
 *
 * Demonstrates how to handle SipHeron webhook events.
 * In production, this would be an HTTP server endpoint.
 *
 * Configure your webhook at:
 * https://app.sipheron.com/dashboard/webhooks
 *
 * Run: npx ts-node examples/webhook-listener.ts
 */

import * as crypto from 'crypto'
import type {
  WebhookEvent,
  AnchorConfirmedEvent,
  VerificationPerformedEvent,
  QuotaWarningEvent,
} from '../src'

/**
 * Verify the HMAC-SHA256 signature of an incoming webhook.
 * Always verify signatures before processing webhook events.
 *
 * @param payload - Raw request body as string
 * @param signature - X-SipHeron-Signature header value
 * @param secret - Your webhook secret from dashboard
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  const expectedHeader = `sha256=${expected}`

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedHeader.length) return false
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedHeader)
  )
}

/**
 * Handle an incoming SipHeron webhook event.
 * In production, this function is called from your HTTP endpoint.
 */
function handleWebhookEvent(event: WebhookEvent): void {
  console.log(`Received webhook: ${event.event} (${event.id})`)

  switch (event.event) {
    case 'anchor.confirmed': {
      const data = event.data as unknown as AnchorConfirmedEvent
      console.log(`  ✓ Document anchored to Solana`)
      console.log(`    Hash:    ${data.hash.slice(0, 16)}...`)
      console.log(`    Block:   ${data.blockNumber}`)
      console.log(`    TX:      ${data.txSignature.slice(0, 16)}...`)
      console.log(`    Explore: ${data.explorerUrl}`)
      break
    }

    case 'anchor.failed': {
      console.log(`  ✗ Anchoring failed`)
      console.log(`    Hash:  ${String((event.data as any).hash).slice(0, 16)}...`)
      console.log(`    Error: ${(event.data as any).error}`)
      // Trigger re-anchor logic here
      break
    }

    case 'verification.performed': {
      const data = event.data as unknown as VerificationPerformedEvent
      console.log(`  👁 Document verified`)
      console.log(`    Authentic: ${data.authentic}`)
      console.log(`    At:        ${data.verifiedAt}`)
      break
    }

    case 'quota.warning': {
      const data = event.data as unknown as QuotaWarningEvent
      console.log(`  ⚠ Quota warning: ${data.threshold}% used`)
      console.log(`    Used:  ${data.used}/${data.limit}`)
      console.log(`    Resets: ${data.resetAt}`)
      // Trigger upgrade flow or notification here
      break
    }

    case 'quota.exceeded': {
      console.log(`  🚫 Monthly quota exceeded`)
      // Trigger upgrade immediately
      break
    }

    case 'anomaly.detected': {
      console.log(`  🔍 Anomaly detected on document ${String((event.data as any).hash).slice(0, 16)}...`)
      console.log(`     Verifications: ${(event.data as any).verificationCount} in ${(event.data as any).windowMinutes} minutes`)
      break
    }

    default:
      console.log(`  Unknown event type: ${event.event}`)
  }
}

// ── Demo: simulate receiving webhook events ──
const webhookSecret = process.env.SIPHERON_WEBHOOK_SECRET || 'demo-secret'

const exampleEvents: WebhookEvent<any>[] = [
  {
    id: 'evt_a3f4b2c1d8e9f0a1',
    event: 'anchor.confirmed',
    created: new Date().toISOString(),
    data: {
      hash: 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
      status: 'confirmed',
      txSignature: '3xK9mPqRabcdef1234567890abcdef1234567890abcdef12',
      blockNumber: '284847291',
      blockTimestamp: new Date().toISOString(),
      explorerUrl: 'https://explorer.solana.com/tx/3xK9mPqR...?cluster=devnet',
      organizationId: 'org-123',
      confirmedAt: new Date().toISOString(),
    } as AnchorConfirmedEvent,
  },
  {
    id: 'evt_b4c5d6e7f8a9b0c1',
    event: 'quota.warning',
    created: new Date().toISOString(),
    data: {
      organizationId: 'org-123',
      plan: 'free',
      threshold: 80,
      used: 80,
      limit: 100,
      remaining: 20,
      percentUsed: '80.0',
      resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as QuotaWarningEvent,
  },
]

console.log('=== SipHeron Webhook Handler Demo ===\n')
exampleEvents.forEach(handleWebhookEvent)

console.log('\n=== Signature Verification Demo ===\n')
const payload = JSON.stringify(exampleEvents[0])
const sig = `sha256=${crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex')}`
const isValid = verifyWebhookSignature(payload, sig, webhookSecret)
console.log('Signature valid:', isValid)
console.log('(Always verify signatures in production before processing events)')
