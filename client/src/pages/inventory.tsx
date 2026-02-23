import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchList } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus, Package, Search, AlertTriangle, ArrowUpRight,
  ArrowDownRight, Warehouse, RefreshCw
} from "lucide-react";

export default function InventoryPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetchList("/api/products"),
  });

  const { data: inventory = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
    queryFn: () => fetchList("/api/inventory"),
  });

  const { data: stockMovements = [] } = useQuery<any[]>({
    queryKey: ["/api/stock-movements"],
    queryFn: () => fetchList("/api/stock-movements"),
  });

  const createInventory = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create inventory entry");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setDialogOpen(false);
      toast({ title: "Inventory entry created" });
    },
    onError: () => {
      toast({ title: "Failed to create inventory entry", variant: "destructive" });
    },
  });

  const updateInventory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Inventory updated" });
    },
    onError: () => {
      toast({ title: "Failed to update inventory", variant: "destructive" });
    },
  });

  const createStockMovement = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to record stock movement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setMovementDialogOpen(false);
      toast({ title: "Stock movement recorded" });
    },
    onError: () => {
      toast({ title: "Failed to record movement", variant: "destructive" });
    },
  });

  const getProductName = (id: string) => products.find((p: any) => p.id === id)?.name || id;
  const getProductSku = (id: string) => products.find((p: any) => p.id === id)?.sku || "—";
  const getProduct = (id: string) => products.find((p: any) => p.id === id);

  const filtered = inventory.filter((inv: any) => {
    const prod = getProduct(inv.productId);
    return prod?.name?.toLowerCase().includes(search.toLowerCase()) ||
      prod?.sku?.toLowerCase().includes(search.toLowerCase());
  });

  const totalItems = inventory.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
  const lowStockCount = inventory.filter((i: any) => {
    const prod = getProduct(i.productId);
    return i.quantity <= (prod?.reorderLevel || 10);
  }).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track stock levels, receive and issue goods</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Record Movement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Stock Movement</DialogTitle></DialogHeader>
              <StockMovementForm
                products={products}
                onSubmit={(data) => createStockMovement.mutate(data)}
                isLoading={createStockMovement.isPending}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Initialize Stock</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Initialize Inventory for Product</DialogTitle></DialogHeader>
              <InventoryForm
                products={products}
                existingInventory={inventory}
                onSubmit={(data) => createInventory.mutate(data)}
                isLoading={createInventory.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatMini label="Products Tracked" value={inventory.length} icon={Package} />
        <StatMini label="Total Units" value={totalItems} icon={Warehouse} />
        <StatMini label="Low Stock" value={lowStockCount} icon={AlertTriangle} />
        <StatMini label="Movements Today" value={stockMovements.length} icon={RefreshCw} />
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Stock Levels</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Reorder Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading || productsLoading) ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No inventory records</TableCell></TableRow>
              ) : (
                filtered.map((inv: any) => {
                  const prod = getProduct(inv.productId);
                  const lowStock = inv.quantity <= (prod?.reorderLevel || 10);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{prod?.name || inv.productId}</TableCell>
                      <TableCell><Badge variant="outline">{prod?.sku || "—"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <span className={lowStock ? "text-red-600 font-bold" : "font-medium"}>{inv.quantity}</span>
                      </TableCell>
                      <TableCell className="text-right">{prod?.reorderLevel || 10}</TableCell>
                      <TableCell>
                        {lowStock ? (
                          <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Low Stock</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 text-xs">OK</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newQty = prompt("Enter new quantity:", inv.quantity.toString());
                            if (newQty !== null) {
                              updateInventory.mutate({ id: inv.id, data: { quantity: parseInt(newQty) || 0 } });
                            }
                          }}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Movements Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockMovements.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No movements recorded</TableCell></TableRow>
              ) : (
                stockMovements.slice(0, 20).map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{getProductName(m.productId)}</TableCell>
                    <TableCell>
                      <Badge className={m.movementType === "received" ? "bg-green-100 text-green-800" : m.movementType === "issued" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                        {m.movementType === "received" ? <ArrowDownRight className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                        {m.movementType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{m.quantity}</TableCell>
                    <TableCell>{m.referenceType ? `${m.referenceType}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{m.notes || "—"}</TableCell>
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

function StatMini({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function InventoryForm({
  products,
  existingInventory,
  onSubmit,
  isLoading,
}: {
  products: any[];
  existingInventory: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({ productId: "", quantity: "0" });
  const availableProducts = products.filter(
    (p: any) => !existingInventory.some((inv: any) => inv.productId === p.id)
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, quantity: parseInt(form.quantity) || 0 }); }} className="flex flex-col gap-4">
      <div>
        <Label>Product</Label>
        <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {availableProducts.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Initial Quantity</Label>
        <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
      </div>
      <Button type="submit" disabled={isLoading || !form.productId}>
        {isLoading ? "Creating..." : "Initialize Stock"}
      </Button>
    </form>
  );
}

function StockMovementForm({
  products,
  onSubmit,
  isLoading,
}: {
  products: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    productId: "",
    movementType: "received",
    quantity: "",
    referenceType: "",
    referenceId: "",
    notes: "",
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({
        ...form,
        quantity: parseInt(form.quantity) || 0,
        referenceType: form.referenceType || null,
        referenceId: form.referenceId || null,
      });
    }} className="flex flex-col gap-4">
      <div>
        <Label>Product</Label>
        <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            {products.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Movement Type</Label>
        <Select value={form.movementType} onValueChange={(v) => setForm({ ...form, movementType: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="received">Received (Stock In)</SelectItem>
            <SelectItem value="issued">Issued (Stock Out)</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Quantity</Label>
        <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" required />
      </div>
      <div>
        <Label>Reference Type</Label>
        <Select value={form.referenceType} onValueChange={(v) => setForm({ ...form, referenceType: v })}>
          <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="procurement">Procurement</SelectItem>
            <SelectItem value="adjustment">Manual Adjustment</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
      </div>
      <Button type="submit" disabled={isLoading || !form.productId || !form.quantity}>
        {isLoading ? "Recording..." : "Record Movement"}
      </Button>
    </form>
  );
}
