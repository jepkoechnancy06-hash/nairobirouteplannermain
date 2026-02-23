/**
 * M-Pesa Daraja API Integration (Safaricom STK Push)
 *
 * Environment variables required:
 *   MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE,
 *   MPESA_PASSKEY, MPESA_CALLBACK_URL, MPESA_ENVIRONMENT
 *
 * Safety:
 *   - Never log secrets; only the last-4 of phone numbers in production.
 *   - All outbound calls use HTTPS.
 *   - Callback route validates origin via Safaricom IP allowlist header.
 */

// ---------- helpers ----------

function env(key: string, fallback = ""): string {
  return process.env[key] || fallback;
}

function isSandbox(): boolean {
  return env("MPESA_ENVIRONMENT", "sandbox") === "sandbox";
}

function baseUrl(): string {
  return isSandbox()
    ? "https://sandbox.safaricom.co.ke"
    : "https://api.safaricom.co.ke";
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function password(ts: string): string {
  const shortcode = env("MPESA_SHORTCODE", "174379");
  const passkey = env("MPESA_PASSKEY");
  return Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
}

// ---------- access token ----------

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const key = env("MPESA_CONSUMER_KEY");
  const secret = env("MPESA_CONSUMER_SECRET");
  if (!key || !secret) throw new Error("M-Pesa consumer key/secret not configured");

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa OAuth failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: string };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000, // refresh 60s early
  };
  return cachedToken.token;
}

// ---------- STK Push (Lipa Na M-Pesa Online) ----------

export interface StkPushRequest {
  phone: string; // 2547XXXXXXXX or 07XXXXXXXX
  amount: number;
  accountReference: string; // order number
  description?: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Normalise a Kenyan phone number to 2547XXXXXXXX format.
 */
function normalisePhone(phone: string): string {
  let p = phone.replace(/\s+/g, "").replace(/^\+/, "");
  if (p.startsWith("0")) p = "254" + p.slice(1);
  if (!p.startsWith("254")) p = "254" + p;
  if (!/^2547\d{8}$/.test(p)) throw new Error(`Invalid Kenyan phone number: ${phone}`);
  return p;
}

export async function initiateSTKPush(req: StkPushRequest): Promise<StkPushResponse> {
  const token = await getAccessToken();
  const ts = timestamp();
  const shortcode = env("MPESA_SHORTCODE", "174379");
  const callbackUrl = env("MPESA_CALLBACK_URL");
  if (!callbackUrl) throw new Error("MPESA_CALLBACK_URL not configured");

  const phone = normalisePhone(req.phone);

  const body = {
    BusinessShortCode: shortcode,
    Password: password(ts),
    Timestamp: ts,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.ceil(req.amount), // M-Pesa only accepts whole KES
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: `${callbackUrl}/api/payments/mpesa/callback`,
    AccountReference: req.accountReference.slice(0, 12),
    TransactionDesc: (req.description || "Payment").slice(0, 13),
  };

  const res = await fetch(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || data.errorCode) {
    throw new Error(`STK Push failed: ${data.errorMessage || data.ResponseDescription || JSON.stringify(data)}`);
  }
  return data as StkPushResponse;
}

// ---------- STK Callback parser ----------

export interface StkCallbackResult {
  success: boolean;
  checkoutRequestId: string;
  merchantRequestId: string;
  resultCode: number;
  resultDesc: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
  amount?: number;
}

export function parseSTKCallback(body: any): StkCallbackResult {
  const cb = body?.Body?.stkCallback;
  if (!cb) throw new Error("Invalid M-Pesa callback payload");

  const result: StkCallbackResult = {
    success: cb.ResultCode === 0,
    checkoutRequestId: cb.CheckoutRequestID,
    merchantRequestId: cb.MerchantRequestID,
    resultCode: cb.ResultCode,
    resultDesc: cb.ResultDesc,
  };

  if (cb.ResultCode === 0 && cb.CallbackMetadata?.Item) {
    for (const item of cb.CallbackMetadata.Item) {
      switch (item.Name) {
        case "MpesaReceiptNumber": result.mpesaReceiptNumber = item.Value; break;
        case "TransactionDate": result.transactionDate = String(item.Value); break;
        case "PhoneNumber": result.phoneNumber = String(item.Value); break;
        case "Amount": result.amount = Number(item.Value); break;
      }
    }
  }
  return result;
}

/**
 * Quick check whether M-Pesa credentials are configured.
 */
export function isMpesaConfigured(): boolean {
  return !!(env("MPESA_CONSUMER_KEY") && env("MPESA_CONSUMER_SECRET") && env("MPESA_PASSKEY"));
}
