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
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import {
  Plus, ShoppingCart, Search, AlertTriangle,
  CheckCircle2, Clock, DollarSign
} from "lucide-react";

export default function ProcurementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: procurements = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/procurements"],
    queryFn: () => fetchList("/api/procurements"),
  });

  const { data: suppliers = [] } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    queryFn: () => fetchList("/api/suppliers"),
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetchList("/api/products"),
  });

  const { data: inventory = [] } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
    queryFn: () => fetchList("/api/inventory"),
  });

  const createProcurement = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/procurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create procurement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurements"] });
      setDialogOpen(false);
      toast({ title: "Purchase order created" });
    },
    onError: () => {
      toast({ title: "Failed to create purchase order", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/procurements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/procurements"] });
      toast({ title: "Status updated" });
    },
  });

  const getSupplierName = (id: string) => suppliers.find((s: any) => s.id === id)?.name || id;
  const getProductName = (id: string) => products.find((p: any) => p.id === id)?.name || id;
  const getProductSku = (id: string) => products.find((p: any) => p.id === id)?.sku || "—";
  const getStockLevel = (productId: string) => {
    const inv = inventory.find((i: any) => i.productId === productId);
    return inv?.quantity ?? 0;
  };

  const filtered = procurements.filter((p: any) => {
    const matchSearch = getProductName(p.productId).toLowerCase().includes(search.toLowerCase()) ||
      getSupplierName(p.supplierId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: procurements.length,
    pending: procurements.filter((p: any) => p.status === "pending").length,
    received: procurements.filter((p: any) => p.status === "received").length,
    totalCost: procurements.reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0),
  };

  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load procurement data.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Procurement"
        description="Create and track purchase orders from suppliers"
      >
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Purchase Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
            <ProcurementForm
              suppliers={suppliers}
              products={products}
              inventory={inventory}
              onSubmit={(data) => createProcurement.mutate(data)}
              isLoading={createProcurement.isPending}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Orders" value={stats.total} icon={ShoppingCart} />
        <StatCard title="Pending" value={stats.pending} icon={Clock} />
        <StatCard title="Received" value={stats.received} icon={CheckCircle2} />
        <StatCard title="Total Cost" value={`KES ${stats.totalCost.toLocaleString()}`} icon={DollarSign} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search procurements..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Procurement Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Stock at Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="transition-colors hover:bg-muted/50"><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="transition-colors hover:bg-muted/50"><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No procurement orders found</TableCell></TableRow>
              ) : (
                filtered.map((pr: any) => (
                  <TableRow key={pr.id} className="transition-colors hover:bg-muted/50">
                    <TableCell><Badge variant="outline">{getProductSku(pr.productId)}</Badge></TableCell>
                    <TableCell className="font-medium">{getProductName(pr.productId)}</TableCell>
                    <TableCell>{getSupplierName(pr.supplierId)}</TableCell>
                    <TableCell className="text-right">{pr.quantity}</TableCell>
                    <TableCell className="text-right">KES {(pr.unitCost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">KES {(pr.totalCost || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{pr.stockAtOrder ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={pr.status === "received" ? "text-green-600" : pr.status === "cancelled" ? "text-red-600" : "text-yellow-600"}>
                        {pr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {pr.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => updateStatus.mutate({ id: pr.id, status: "received" })}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Receive
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcurementForm({
  suppliers,
  products,
  inventory,
  onSubmit,
  isLoading,
}: {
  suppliers: any[];
  products: any[];
  inventory: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    supplierId: "",
    productId: "",
    quantity: "",
    unitCost: "",
  });

  const selectedProduct = products.find((p: any) => p.id === form.productId);
  const currentStock = inventory.find((i: any) => i.productId === form.productId)?.quantity ?? 0;
  const totalCost = (parseFloat(form.quantity) || 0) * (parseFloat(form.unitCost) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      quantity: parseInt(form.quantity) || 0,
      unitCost: parseFloat(form.unitCost) || 0,
      totalCost,
      stockAtOrder: currentStock,
      status: "pending",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Supplier</Label>
        <Select value={form.supplierId} onValueChange={(v) => setForm({ ...form, supplierId: v })}>
          <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
          <SelectContent>
            {suppliers.filter((s: any) => s.status === "active").map((s: any) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Product</Label>
        <Select value={form.productId} onValueChange={(v) => {
          const prod = products.find((p: any) => p.id === v);
          setForm({ ...form, productId: v, unitCost: prod?.costPrice?.toString() || form.unitCost });
        }}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {products.filter((p: any) => p.status === "active").map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground mt-1">
            Current stock: {currentStock} | Reorder level: {selectedProduct.reorderLevel}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Quantity</Label>
          <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" required />
        </div>
        <div>
          <Label>Unit Cost (KES)</Label>
          <Input type="number" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} placeholder="0" required />
        </div>
      </div>
      {totalCost > 0 && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <span className="text-muted-foreground">Total Cost: </span>
          <span className="font-bold">KES {totalCost.toLocaleString()}</span>
        </div>
      )}
      <Button type="submit" disabled={isLoading || !form.supplierId || !form.productId || !form.quantity}>
        {isLoading ? "Creating..." : "Create Purchase Order"}
      </Button>
    </form>
  );
}
