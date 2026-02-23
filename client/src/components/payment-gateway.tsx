/**
 * PaymentGatewaySelector — reusable component that lets the user
 * choose M-Pesa, Flutterwave, or Crypto and initiate payment.
 *
 * Props:
 *   orderId, orderNumber, amount, customerPhone, customerEmail, customerName
 *   onPaymentCreated(payment) — called after the payment record is created
 *
 * Queries /api/payments/gateway-status to know which gateways are live.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Smartphone, CreditCard, Bitcoin, Loader2, ExternalLink,
  CheckCircle2, AlertTriangle, Shield
} from "lucide-react";

// ---------- types ----------

interface GatewayStatus {
  mpesa: boolean;
  flutterwave: boolean;
  crypto: boolean;
  flutterwavePublicKey: string | null;
}

type GatewayType = "mpesa" | "flutterwave" | "crypto";

export interface PaymentGatewayProps {
  orderId: string;
  orderNumber: string;
  amount: number; // KES
  customerPhone?: string;
  customerEmail?: string;
  customerName?: string;
  onPaymentCreated?: (payment: any) => void;
  onClose?: () => void;
}

// ---------- component ----------

export default function PaymentGatewaySelector({
  orderId,
  orderNumber,
  amount,
  customerPhone = "",
  customerEmail = "",
  customerName = "",
  onPaymentCreated,
  onClose,
}: PaymentGatewayProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<GatewayType | null>(null);
  const [phone, setPhone] = useState(customerPhone);
  const [email, setEmail] = useState(customerEmail);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [stkSent, setStkSent] = useState(false);

  // gateway availability
  const { data: gateways } = useQuery<GatewayStatus>({
    queryKey: ["/api/payments/gateway-status"],
    queryFn: async () => {
      const res = await fetch("/api/payments/gateway-status", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch gateway status");
      return res.json();
    },
  });

  // create the payment record first, then initiate the gateway
  const createAndInitiate = useMutation({
    mutationFn: async (gateway: GatewayType) => {
      setError(null);
      setPaymentLink(null);
      setStkSent(false);

      // 1. Create payment record
      const createRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          orderId,
          amount,
          currency: gateway === "crypto" ? "USD" : "KES",
          paymentMethod: gateway,
          phone: phone || null,
          status: "pending",
        }),
      });
      if (!createRes.ok) throw new Error("Failed to create payment record");
      const payment = await createRes.json();

      // 2. Initiate the specific gateway
      let initRes: Response;
      let initData: any;

      switch (gateway) {
        case "mpesa": {
          if (!phone) throw new Error("Phone number is required for M-Pesa");
          initRes = await fetch("/api/payments/mpesa/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              paymentId: payment.id,
              phone,
              amount,
              orderNumber,
            }),
          });
          initData = await initRes.json();
          if (!initRes.ok) throw new Error(initData.error || "M-Pesa STK Push failed");
          setStkSent(true);
          break;
        }
        case "flutterwave": {
          initRes = await fetch("/api/payments/flutterwave/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              paymentId: payment.id,
              amount,
              currency: "KES",
              customerEmail: email || "customer@veew.co.ke",
              customerPhone: phone,
              customerName,
              orderNumber,
            }),
          });
          initData = await initRes.json();
          if (!initRes.ok) throw new Error(initData.error || "Flutterwave payment failed");
          setPaymentLink(initData.paymentLink);
          break;
        }
        case "crypto": {
          initRes = await fetch("/api/payments/crypto/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              paymentId: payment.id,
              orderId,
              orderNumber,
              amountKes: amount,
              customerName,
              customerEmail: email,
            }),
          });
          initData = await initRes.json();
          if (!initRes.ok) throw new Error(initData.error || "Crypto payment failed");
          setPaymentLink(initData.hostedUrl);
          break;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      onPaymentCreated?.(payment);
      return { payment, initData };
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const isLoading = createAndInitiate.isPending;
  const anyEnabled = gateways?.mpesa || gateways?.flutterwave || gateways?.crypto;

  // ---- render ----

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order {orderNumber}</p>
          <p className="text-2xl font-bold">KES {amount.toLocaleString()}</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Shield className="h-3 w-3" /> Secure
        </Badge>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* STK Push success */}
      {stkSent && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            M-Pesa STK Push sent! Check your phone and enter your PIN to complete payment.
          </AlertDescription>
        </Alert>
      )}

      {/* Redirect link */}
      {paymentLink && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <ExternalLink className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Payment page ready.{" "}
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold"
            >
              Click here to complete payment →
            </a>
          </AlertDescription>
        </Alert>
      )}

      {!anyEnabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No payment gateways are configured. Contact an administrator to set up M-Pesa, Flutterwave, or Crypto environment variables.
          </AlertDescription>
        </Alert>
      )}

      {/* Gateway Selection Cards */}
      {!stkSent && !paymentLink && (
        <>
          <p className="text-sm font-medium text-muted-foreground">Choose payment method</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* M-Pesa */}
            <GatewayCard
              id="mpesa"
              label="M-Pesa"
              description="Pay via Safaricom STK Push"
              icon={Smartphone}
              color="bg-green-600"
              enabled={!!gateways?.mpesa}
              selected={selected === "mpesa"}
              onClick={() => setSelected("mpesa")}
            />
            {/* Flutterwave */}
            <GatewayCard
              id="flutterwave"
              label="Flutterwave"
              description="Card, USSD, Bank Transfer"
              icon={CreditCard}
              color="bg-orange-500"
              enabled={!!gateways?.flutterwave}
              selected={selected === "flutterwave"}
              onClick={() => setSelected("flutterwave")}
            />
            {/* Crypto */}
            <GatewayCard
              id="crypto"
              label="Crypto"
              description="BTC, ETH, USDT, USDC"
              icon={Bitcoin}
              color="bg-yellow-500"
              enabled={!!gateways?.crypto}
              selected={selected === "crypto"}
              onClick={() => setSelected("crypto")}
            />
          </div>

          {/* Gateway-specific fields */}
          {selected === "mpesa" && (
            <div>
              <Label>Phone Number (Safaricom)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 7XX XXX XXX"
                type="tel"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You will receive an STK Push prompt on this number.
              </p>
            </div>
          )}

          {selected === "flutterwave" && (
            <div className="flex flex-col gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  type="email"
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254..."
                  type="tel"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                You will be redirected to a secure Flutterwave checkout page.
              </p>
            </div>
          )}

          {selected === "crypto" && (
            <div>
              <p className="text-sm text-muted-foreground">
                A Coinbase Commerce checkout page will open where you can pay with
                Bitcoin, Ethereum, USDT, USDC, or other supported cryptocurrencies.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Approximate amount: ~${((amount * 0.0065) || 0).toFixed(2)} USD
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1"
              disabled={!selected || isLoading}
              onClick={() => selected && createAndInitiate.mutate(selected)}
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                `Pay KES ${amount.toLocaleString()} via ${selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : "..."}`
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
            )}
          </div>
        </>
      )}

      {/* After STK/redirect, offer a close/done button */}
      {(stkSent || paymentLink) && onClose && (
        <Button variant="outline" onClick={onClose} className="w-full">
          Done
        </Button>
      )}
    </div>
  );
}

// ---------- Gateway card sub-component ----------

function GatewayCard({
  id,
  label,
  description,
  icon: Icon,
  color,
  enabled,
  selected,
  onClick,
}: {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  enabled: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        !enabled ? "opacity-40 pointer-events-none" : ""
      } ${selected ? "ring-2 ring-primary border-primary" : "hover:border-primary/50"}`}
      onClick={enabled ? onClick : undefined}
      data-testid={`gateway-${id}`}
    >
      <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
        <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        {!enabled && (
          <Badge variant="outline" className="text-[10px]">Not configured</Badge>
        )}
      </CardContent>
    </Card>
  );
}
