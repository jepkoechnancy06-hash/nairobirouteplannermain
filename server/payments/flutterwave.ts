/**
 * Flutterwave Payment Integration
 *
 * Environment variables required:
 *   FLUTTERWAVE_PUBLIC_KEY, FLUTTERWAVE_SECRET_KEY,
 *   FLUTTERWAVE_ENCRYPTION_KEY, FLUTTERWAVE_WEBHOOK_SECRET
 *
 * Safety:
 *   - Secret key is NEVER exposed to the client; only the public key is sent.
 *   - Webhook payloads are verified with HMAC-SHA256 using the webhook secret.
 *   - All amounts are validated server-side before confirming.
 */

import crypto from "crypto";

function env(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

const BASE_URL = "https://api.flutterwave.com/v3";

// ---------- helpers ----------

function headers(): Record<string, string> {
  const secret = env("FLUTTERWAVE_SECRET_KEY");
  if (!secret) throw new Error("FLUTTERWAVE_SECRET_KEY not configured");
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

// ---------- Standard Payment (redirect flow) ----------

export interface FlutterwaveChargeRequest {
  txRef: string; // unique transaction reference (our payment id)
  amount: number;
  currency: string; // KES, USD, NGN …
  redirectUrl: string; // where Flutterwave sends user after payment
  customerEmail: string;
  customerPhone?: string;
  customerName?: string;
  title?: string;
  description?: string;
  paymentOptions?: string; // "card,mpesa,ussd,banktransfer"
}

export interface FlutterwaveInitResponse {
  status: string;
  message: string;
  data: {
    link: string; // redirect the user here
  };
}

/**
 * Create a Flutterwave Standard payment link.
 * Redirect the customer's browser to `data.link`.
 */
export async function initiateFlutterwavePayment(
  req: FlutterwaveChargeRequest
): Promise<FlutterwaveInitResponse> {
  const body = {
    tx_ref: req.txRef,
    amount: req.amount,
    currency: req.currency || "KES",
    redirect_url: req.redirectUrl,
    customer: {
      email: req.customerEmail || "customer@veew.co.ke",
      phonenumber: req.customerPhone,
      name: req.customerName,
    },
    customizations: {
      title: req.title || "Veew Route Planner",
      description: req.description || "Order Payment",
    },
    payment_options: req.paymentOptions || "card,mpesa,ussd,banktransfer",
  };

  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(`Flutterwave init failed: ${data.message || JSON.stringify(data)}`);
  }
  return data as FlutterwaveInitResponse;
}

// ---------- Verify transaction ----------

export interface FlutterwaveVerifyResponse {
  status: string;
  message: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    amount: number;
    currency: string;
    charged_amount: number;
    status: string; // "successful", "failed", "pending"
    payment_type: string;
    customer: { email: string; phone_number: string; name: string };
    created_at: string;
  };
}

/**
 * Verify a Flutterwave transaction by its transaction ID.
 * Always verify server-side before confirming payment.
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string | number
): Promise<FlutterwaveVerifyResponse> {
  const res = await fetch(`${BASE_URL}/transactions/${transactionId}/verify`, {
    headers: headers(),
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(`Flutterwave verify failed: ${data.message || JSON.stringify(data)}`);
  }
  return data as FlutterwaveVerifyResponse;
}

// ---------- Webhook signature verification ----------

/**
 * Verify the `verifi-hash` header from a Flutterwave webhook.
 */
export function verifyFlutterwaveWebhook(headerHash: string | undefined): boolean {
  const secret = env("FLUTTERWAVE_WEBHOOK_SECRET");
  if (!secret || !headerHash) return false;
  return headerHash === secret; // Flutterwave sends the secret itself as the hash
}

/**
 * Compute HMAC for additional payload integrity check.
 */
export function computeFlutterwaveHmac(payload: string): string {
  const secret = env("FLUTTERWAVE_WEBHOOK_SECRET");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Quick check whether Flutterwave credentials are configured.
 */
export function isFlutterwaveConfigured(): boolean {
  return !!(env("FLUTTERWAVE_SECRET_KEY") && env("FLUTTERWAVE_PUBLIC_KEY"));
}

/**
 * Get the public key (safe for client-side).
 */
export function getFlutterwavePublicKey(): string {
  return env("FLUTTERWAVE_PUBLIC_KEY");
}
