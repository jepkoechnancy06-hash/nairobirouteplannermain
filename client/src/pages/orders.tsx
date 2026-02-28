import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchList } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Plus, ClipboardList, Clock, Package, CheckCircle2,
  CreditCard, Search, Filter, Wallet
} from "lucide-react";
import PaymentGatewaySelector from "@/components/payment-gateway";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  packed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  dispatched: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusFlow = ["pending", "confirmed", "processing", "packed", "dispatched", "delivered", "paid"];

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payDialogOrder, setPayDialogOrder] = useState<any>(null);

  const { data: orders = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/orders"],
    queryFn: () => fetchList("/api/orders"),
  });

  const { data: shops = [] } = useQuery<any[]>({
    queryKey: ["/api/shops"],
    queryFn: () => fetchList("/api/shops"),
  });

  const { data: salespersons = [] } = useQuery<any[]>({
    queryKey: ["/api/salespersons"],
    queryFn: () => fetchList("/api/salespersons"),
  });

  const createOrder = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setDialogOpen(false);
      toast({ title: "Order created successfully" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const filtered = orders.filter((o: any) => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.shopId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const now = new Date();
  const cutoffHour = 16; // 4 PM
  const isCutoffPassed = now.getHours() >= cutoffHour;

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    processing: orders.filter((o: any) => ["confirmed", "processing", "packed"].includes(o.status)).length,
    delivered: orders.filter((o: any) => o.status === "delivered" || o.status === "paid").length,
    totalValue: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
  };

  const getShopName = (shopId: string) => {
    const shop = shops.find((s: any) => s.id === shopId);
    return shop?.name || shopId;
  };

  const getSalespersonName = (spId: string) => {
    const sp = salespersons.find((s: any) => s.id === spId);
    return sp?.name || spId || "—";
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <ClipboardList className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load orders. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Orders Management"
        description="Track orders from salesperson through delivery"
      >
        {isCutoffPassed && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Past 4 PM Cutoff
          </Badge>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <OrderForm
              shops={shops}
              salespersons={salespersons}
              onSubmit={(data) => createOrder.mutate(data)}
              isLoading={createOrder.isPending}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Orders" value={stats.total} icon={ClipboardList} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Processing" value={stats.processing} icon={Package} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle2} />
        <StatCard title="Total Value" value={`KES ${stats.totalValue.toLocaleString()}`} icon={CreditCard} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusFlow.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="transition-colors hover:bg-muted/50">
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="transition-colors hover:bg-muted/50">
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order: any) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <TableRow key={order.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{getShopName(order.shopId)}</TableCell>
                      <TableCell>{getSalespersonName(order.salespersonId)}</TableCell>
                      <TableCell>KES {(order.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.deliveryDate || "—"}</TableCell>
                      <TableCell>
                        {order.cutoffMet ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Met
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <Clock className="h-3 w-3 mr-1" /> Missed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {nextStatus && order.status !== "cancelled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}
                            >
                              → {nextStatus}
                            </Button>
                          )}
                          {["confirmed", "processing", "packed", "dispatched", "delivered"].includes(order.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => setPayDialogOrder(order)}
                            >
                              <Wallet className="h-3 w-3 mr-1" /> Pay
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

      {/* Payment Gateway Dialog */}
      <Dialog open={!!payDialogOrder} onOpenChange={(open) => { if (!open) setPayDialogOrder(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pay for Order {payDialogOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {payDialogOrder && (
            <PaymentGatewaySelector
              orderId={payDialogOrder.id}
              orderNumber={payDialogOrder.orderNumber}
              amount={payDialogOrder.totalAmount || 0}
              customerPhone={shops.find((s: any) => s.id === payDialogOrder.shopId)?.phone || ""}
              customerName={getShopName(payDialogOrder.shopId)}
              onPaymentCreated={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
              }}
              onClose={() => setPayDialogOrder(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getNextStatus(current: string): string | null {
  const flow = ["pending", "confirmed", "processing", "packed", "dispatched", "delivered", "paid"];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function OrderForm({
  shops,
  salespersons,
  onSubmit,
  isLoading,
}: {
  shops: any[];
  salespersons: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    shopId: "",
    salespersonId: "",
    totalAmount: "",
    notes: "",
    orderImageUrl: "",
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  });

  // Order line items
  const [lineItems, setLineItems] = useState<{ productId: string; quantity: string; unitPrice: string }[]>([]);
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetchList("/api/products"),
  });

  const addLineItem = () => {
    setLineItems([...lineItems, { productId: "", quantity: "1", unitPrice: "" }]);
  };

  const removeLineItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, field: string, value: string) => {
    const updated = [...lineItems];
    (updated[idx] as any)[field] = value;
    // Auto-fill price when product is selected
    if (field === "productId") {
      const prod = products.find((p: any) => p.id === value);
      if (prod) updated[idx].unitPrice = prod.unitPrice?.toString() || "";
    }
    setLineItems(updated);
  };

  // Calculate total from line items if any exist
  const lineItemsTotal = lineItems.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
  }, 0);

  const effectiveTotal = lineItems.length > 0 ? lineItemsTotal : parseFloat(form.totalAmount) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const cutoffMet = now.getHours() < 16;
    onSubmit({
      ...form,
      totalAmount: effectiveTotal,
      orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
      cutoffMet,
      status: "pending",
      orderImageUrl: form.orderImageUrl || null,
      lineItems: lineItems.length > 0 ? lineItems.map(item => ({
        productId: item.productId,
        quantity: parseInt(item.quantity) || 1,
        unitPrice: parseFloat(item.unitPrice) || 0,
        totalPrice: (parseInt(item.quantity) || 1) * (parseFloat(item.unitPrice) || 0),
      })) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
      <div>
        <Label>Customer (Shop)</Label>
        <Select value={form.shopId} onValueChange={(v) => setForm({ ...form, shopId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {shops.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.category?.replace(/_/g, " ")})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Salesperson</Label>
        <Select value={form.salespersonId} onValueChange={(v) => setForm({ ...form, salespersonId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select salesperson" />
          </SelectTrigger>
          <SelectContent>
            {salespersons.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Order Line Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Order Items (SKU)</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="h-3 w-3 mr-1" /> Add Item
          </Button>
        </div>
        {lineItems.length > 0 ? (
          <div className="space-y-2 rounded-md border p-3">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  {idx === 0 && <Label className="text-xs">Product</Label>}
                  <Select value={item.productId} onValueChange={(v) => updateLineItem(idx, "productId", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-16">
                  {idx === 0 && <Label className="text-xs">Qty</Label>}
                  <Input className="h-8 text-xs" type="number" value={item.quantity} onChange={(e) => updateLineItem(idx, "quantity", e.target.value)} />
                </div>
                <div className="w-24">
                  {idx === 0 && <Label className="text-xs">Price</Label>}
                  <Input className="h-8 text-xs" type="number" value={item.unitPrice} onChange={(e) => updateLineItem(idx, "unitPrice", e.target.value)} />
                </div>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => removeLineItem(idx)}>×</Button>
              </div>
            ))}
            <div className="text-right text-sm font-medium pt-2 border-t">
              Line Items Total: KES {lineItemsTotal.toLocaleString()}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No items added. Enter total amount below, or add items for SKU-level tracking.</p>
        )}
      </div>

      {lineItems.length === 0 && (
        <div>
          <Label>Total Amount (KES)</Label>
          <Input
            type="number"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
            placeholder="0"
          />
        </div>
      )}

      <div>
        <Label>Order Image URL (Snapshot)</Label>
        <Input
          value={form.orderImageUrl}
          onChange={(e) => setForm({ ...form, orderImageUrl: e.target.value })}
          placeholder="https://... (WhatsApp order book snapshot URL)"
        />
        <p className="text-xs text-muted-foreground mt-1">Paste the URL of the order book snapshot sent via WhatsApp</p>
      </div>
      <div>
        <Label>Delivery Date</Label>
        <Input
          type="date"
          value={form.deliveryDate}
          onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Order details, special instructions..."
        />
      </div>
      <Button type="submit" disabled={isLoading || !form.shopId}>
        {isLoading ? "Creating..." : "Create Order"}
      </Button>
    </form>
  );
}
