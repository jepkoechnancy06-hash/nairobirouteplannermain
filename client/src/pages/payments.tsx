import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchList } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Plus, CreditCard, Search, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Smartphone,
  Bitcoin, Shield
} from "lucide-react";
import PaymentGatewaySelector from "@/components/payment-gateway";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  received: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  refunded: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const methodIcons: Record<string, React.ElementType> = {
  mpesa: Smartphone,
  flutterwave: CreditCard,
  crypto: Bitcoin,
  cash: DollarSign,
};

const methodLabels: Record<string, string> = {
  mpesa: "M-Pesa",
  flutterwave: "Flutterwave",
  crypto: "Crypto",
  cash: "Cash",
};

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gatewayDialogOpen, setGatewayDialogOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<any>(null);

  const { data: payments = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/payments"],
    queryFn: () => fetchList("/api/payments"),
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: () => fetchList("/api/orders"),
  });

  const { data: shops = [] } = useQuery<any[]>({
    queryKey: ["/api/shops"],
    queryFn: () => fetchList("/api/shops"),
  });

  const createPayment = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setDialogOpen(false);
      toast({ title: "Payment recorded" });
    },
    onError: () => {
      toast({ title: "Failed to record payment", variant: "destructive" });
    },
  });

  const updatePaymentStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update payment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({ title: "Payment status updated" });
    },
  });

  const getOrderNumber = (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId);
    return order?.orderNumber || orderId?.slice(0, 8) || "—";
  };

  const getShopForOrder = (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) return "—";
    const shop = shops.find((s: any) => s.id === order.shopId);
    return shop?.name || order.shopId?.slice(0, 8) || "—";
  };

  const getShopPhoneForOrder = (orderId: string) => {
    const order = orders.find((o: any) => o.id === orderId);
    if (!order) return "";
    const shop = shops.find((s: any) => s.id === order.shopId);
    return shop?.phone || "";
  };

  const filtered = payments.filter((p: any) => {
    const matchSearch =
      p.mpesaReference?.toLowerCase().includes(search.toLowerCase()) ||
      p.mpesaReceiptNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.flutterwaveRef?.toLowerCase().includes(search.toLowerCase()) ||
      p.cryptoTxHash?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase()) ||
      getOrderNumber(p.orderId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchMethod = methodFilter === "all" || p.paymentMethod === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const stats = {
    total: payments.length,
    pending: payments.filter((p: any) => ["pending", "processing", "received"].includes(p.status)).length,
    confirmed: payments.filter((p: any) => p.status === "confirmed").length,
    totalConfirmed: payments
      .filter((p: any) => p.status === "confirmed")
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0),
    byMethod: {
      mpesa: payments.filter((p: any) => p.paymentMethod === "mpesa").length,
      flutterwave: payments.filter((p: any) => p.paymentMethod === "flutterwave").length,
      crypto: payments.filter((p: any) => p.paymentMethod === "crypto").length,
      cash: payments.filter((p: any) => p.paymentMethod === "cash" || !p.paymentMethod).length,
    },
  };

  const eligibleOrders = orders.filter((o: any) =>
    ["delivered", "dispatched", "packed", "confirmed", "processing"].includes(o.status)
  );

  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load payments.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Payments & Finance"
        description="M-Pesa, Flutterwave, Crypto & cash payments"
      >
        <Dialog open={gatewayDialogOpen} onOpenChange={(open) => {
          setGatewayDialogOpen(open);
          if (!open) setSelectedOrderForPayment(null);
        }}>
          <DialogTrigger asChild>
            <Button variant="default">
              <Shield className="h-4 w-4 mr-2" /> Pay via Gateway
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Initiate Payment</DialogTitle>
            </DialogHeader>
            {!selectedOrderForPayment ? (
              <OrderSelectorForPayment
                orders={eligibleOrders}
                shops={shops}
                onSelect={(order) => setSelectedOrderForPayment(order)}
              />
            ) : (
              <PaymentGatewaySelector
                orderId={selectedOrderForPayment.id}
                orderNumber={selectedOrderForPayment.orderNumber}
                amount={selectedOrderForPayment.totalAmount || 0}
                customerPhone={getShopPhoneForOrder(selectedOrderForPayment.id)}
                customerName={getShopForOrder(selectedOrderForPayment.id)}
                onPaymentCreated={() => {
                  queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
                }}
                onClose={() => {
                  setSelectedOrderForPayment(null);
                  setGatewayDialogOpen(false);
                }}
              />
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" /> Manual Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Manual Payment</DialogTitle></DialogHeader>
            <ManualPaymentForm
              orders={orders}
              shops={shops}
              onSubmit={(data) => createPayment.mutate(data)}
              isLoading={createPayment.isPending}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Payments" value={stats.total} icon={CreditCard} />
        <StatCard title="Pending / Processing" value={stats.pending} icon={Clock} />
        <StatCard title="Confirmed" value={stats.confirmed} icon={CheckCircle2} />
        <StatCard title="Confirmed Total" value={`KES ${stats.totalConfirmed.toLocaleString()}`} icon={DollarSign} />
      </div>

      {/* Method breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MethodBadge method="mpesa" count={stats.byMethod.mpesa} />
        <MethodBadge method="flutterwave" count={stats.byMethod.flutterwave} />
        <MethodBadge method="crypto" count={stats.byMethod.crypto} />
        <MethodBadge method="cash" count={stats.byMethod.cash} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reference, phone, order..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="flutterwave">Flutterwave</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="transition-colors hover:bg-muted/50"><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="transition-colors hover:bg-muted/50"><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
              ) : (
                filtered.map((p: any) => {
                  const method = p.paymentMethod || "cash";
                  const MethodIcon = methodIcons[method] || DollarSign;
                  const ref = p.mpesaReceiptNumber || p.mpesaReference || p.flutterwaveRef || p.cryptoTxHash || "—";
                  return (
                    <TableRow key={p.id} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MethodIcon className="h-4 w-4" />
                          <span className="text-xs font-medium">{methodLabels[method] || method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[140px] truncate" title={ref}>
                        {ref}
                      </TableCell>
                      <TableCell>{getOrderNumber(p.orderId)}</TableCell>
                      <TableCell>{getShopForOrder(p.orderId)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {p.currency === "USD" ? "$" : "KES "}
                        {(p.amount || 0).toLocaleString()}
                        {p.cryptoAmountUsd ? (
                          <span className="block text-xs text-muted-foreground">≈ ${p.cryptoAmountUsd}</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[p.status] || ""}>{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {["pending", "processing", "received"].includes(p.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "confirmed" })}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
                            </Button>
                          )}
                          {p.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => updatePaymentStatus.mutate({ id: p.id, status: "failed" })}
                            >
                              Failed
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============ Sub-components ============

function MethodBadge({ method, count }: { method: string; count: number }) {
  const Icon = methodIcons[method] || DollarSign;
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{methodLabels[method] || method}</span>
        <Badge variant="secondary" className="ml-auto">{count}</Badge>
      </CardContent>
    </Card>
  );
}

function OrderSelectorForPayment({
  orders,
  shops,
  onSelect,
}: {
  orders: any[];
  shops: any[];
  onSelect: (order: any) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = orders.filter((o: any) => {
    const shop = shops.find((s: any) => s.id === o.shopId);
    const text = `${o.orderNumber} ${shop?.name || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Select an order to pay for</p>
      <Input
        placeholder="Search orders..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No eligible orders</p>
        ) : (
          filtered.map((o: any) => {
            const shop = shops.find((s: any) => s.id === o.shopId);
            return (
              <Card
                key={o.id}
                className="cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => onSelect(o)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{shop?.name || "Unknown"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">KES {(o.totalAmount || 0).toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">{o.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function ManualPaymentForm({
  orders,
  shops,
  onSubmit,
  isLoading,
}: {
  orders: any[];
  shops: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    orderId: "",
    amount: "",
    paymentMethod: "mpesa",
    mpesaReference: "",
    phone: "",
    status: "received",
  });

  const eligibleOrders = orders.filter((o: any) =>
    ["delivered", "dispatched", "packed", "confirmed", "processing"].includes(o.status)
  );

  const selectedOrder = orders.find((o: any) => o.id === form.orderId);
  const shopName = selectedOrder ? shops.find((s: any) => s.id === selectedOrder.shopId)?.name : "";

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        ...form,
        amount: parseFloat(form.amount) || 0,
        mpesaReference: form.mpesaReference || null,
        phone: form.phone || null,
        currency: "KES",
      });
    }} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
      <div>
        <Label>Order</Label>
        <Select value={form.orderId} onValueChange={(v) => {
          const order = orders.find((o: any) => o.id === v);
          setForm({ ...form, orderId: v, amount: order?.totalAmount?.toString() || form.amount });
        }}>
          <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
          <SelectContent>
            {eligibleOrders.map((o: any) => {
              const shop = shops.find((s: any) => s.id === o.shopId);
              return (
                <SelectItem key={o.id} value={o.id}>
                  {o.orderNumber} — {shop?.name || o.shopId?.slice(0, 8)} (KES {(o.totalAmount || 0).toLocaleString()})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {shopName && <p className="text-xs text-muted-foreground mt-1">Customer: {shopName}</p>}
      </div>

      <div>
        <Label>Payment Method</Label>
        <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mpesa">M-Pesa</SelectItem>
            <SelectItem value="flutterwave">Flutterwave</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {form.paymentMethod === "mpesa" && (
        <div>
          <Label>M-Pesa Reference</Label>
          <Input value={form.mpesaReference} onChange={(e) => setForm({ ...form, mpesaReference: e.target.value.toUpperCase() })} placeholder="e.g. SHQ1234567" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Phone Number</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254..." />
        </div>
        <div>
          <Label>Amount (KES)</Label>
          <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" required />
        </div>
      </div>

      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isLoading || !form.orderId || !form.amount}>
        {isLoading ? "Recording..." : "Record Payment"}
      </Button>
    </form>
  );
}
