/**
 * Cryptocurrency Payment Integration (Coinbase Commerce)
 *
 * Environment variables required:
 *   COINBASE_COMMERCE_API_KEY, COINBASE_COMMERCE_WEBHOOK_SECRET
 *
 * Safety:
 *   - API key never exposed to client.
 *   - Webhook payloads verified with HMAC-SHA256 signature.
 *   - Prices are converted KES → USD server-side using a conservative rate.
 *   - Supports BTC, ETH, USDT, USDC, LTC, DOGE.
 */

import crypto from "crypto";

function env(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

const BASE_URL = "https://api.commerce.coinbase.com";

function headers(): Record<string, string> {
  const key = env("COINBASE_COMMERCE_API_KEY");
  if (!key) throw new Error("COINBASE_COMMERCE_API_KEY not configured");
  return {
    "X-CC-Api-Key": key,
    "X-CC-Version": "2018-03-22",
    "Content-Type": "application/json",
  };
}

// ---------- KES → USD conversion (conservative fixed rate, override with env) ----------

function kesRateToUsd(): number {
  const custom = parseFloat(env("KES_USD_RATE", "0"));
  if (custom > 0) return custom;
  return 0.0065; // ~1 USD = 154 KES — conservative fallback
}

export function convertKesToUsd(kes: number): number {
  return Math.round(kes * kesRateToUsd() * 100) / 100; // round to cents
}

// ---------- Create a charge ----------

export interface CryptoChargeRequest {
  paymentId: string; // our internal payment id
  orderId: string;
  orderNumber: string;
  amountKes: number;
  customerName?: string;
  customerEmail?: string;
  redirectUrl?: string;
  cancelUrl?: string;
}

export interface CryptoChargeResponse {
  id: string;
  code: string;
  hostedUrl: string; // redirect user here
  expiresAt: string;
  addresses: Record<string, string>; // network → address
  pricing: Record<string, { amount: string; currency: string }>;
}

export async function createCryptoCharge(
  req: CryptoChargeRequest
): Promise<CryptoChargeResponse> {
  const usdAmount = convertKesToUsd(req.amountKes);
  if (usdAmount < 0.01) throw new Error("Amount too small for crypto payment");

  const body = {
    name: `Order ${req.orderNumber}`,
    description: `Payment for order ${req.orderNumber}`,
    pricing_type: "fixed_price",
    local_price: {
      amount: usdAmount.toFixed(2),
      currency: "USD",
    },
    metadata: {
      payment_id: req.paymentId,
      order_id: req.orderId,
      order_number: req.orderNumber,
      customer_name: req.customerName || "",
    },
    redirect_url: req.redirectUrl || undefined,
    cancel_url: req.cancelUrl || undefined,
  };

  const res = await fetch(`${BASE_URL}/charges`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Coinbase charge failed: ${data.error?.message || JSON.stringify(data)}`);
  }

  const charge = data.data;
  return {
    id: charge.id,
    code: charge.code,
    hostedUrl: charge.hosted_url,
    expiresAt: charge.expires_at,
    addresses: charge.addresses || {},
    pricing: charge.pricing || {},
  };
}

// ---------- Retrieve a charge ----------

export async function getCryptoCharge(chargeId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/charges/${chargeId}`, {
    headers: headers(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Coinbase fetch charge failed: ${JSON.stringify(data)}`);
  return data.data;
}

// ---------- Webhook verification ----------

/**
 * Verify Coinbase Commerce webhook signature.
 * Pass the raw request body (Buffer/string) and the X-CC-Webhook-Signature header.
 */
export function verifyCoinbaseWebhook(
  rawBody: string | Buffer,
  signature: string | undefined
): boolean {
  const secret = env("COINBASE_COMMERCE_WEBHOOK_SECRET");
  if (!secret || !signature) return false;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"))
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

// ---------- Map Coinbase event → our status ----------

export function mapCoinbaseEventToStatus(
  eventType: string
): "processing" | "confirmed" | "failed" | "pending" {
  switch (eventType) {
    case "charge:confirmed":
      return "confirmed";
    case "charge:failed":
    case "charge:expired":
      return "failed";
    case "charge:pending":
    case "charge:created":
      return "processing";
    default:
      return "pending";
  }
}

/**
 * Quick check whether Coinbase Commerce credentials are configured.
 */
export function isCryptoConfigured(): boolean {
  return !!env("COINBASE_COMMERCE_API_KEY");
}
